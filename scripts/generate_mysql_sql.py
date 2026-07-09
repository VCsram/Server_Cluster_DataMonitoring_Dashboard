# -*- coding: utf-8 -*-
"""从项目 data/*.dat 生成 MySQL 建表 + 全量导入 SQL。"""
import csv
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA = PROJECT_ROOT / "data"
OUT = PROJECT_ROOT / "output" / "import_data.sql"


def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("\\", "\\\\").replace("'", "''") + "'"


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def qcol(name):
    """MySQL 保留字列名加反引号"""
    if name in ("mod", "desc"):
        return f"`{name}`"
    return name


def qcols(cols):
    return ", ".join(qcol(c) for c in cols)


def main():
    lines = []

    def add(s=""):
        lines.append(s)

    add("-- ============================================================")
    add("-- 数据作业：四表建库建表 + 全量数据导入")
    add("-- 生成方式：由 digital_display_project/data/*.dat 自动导出")
    add("-- ============================================================")
    add("")
    add("CREATE DATABASE IF NOT EXISTS tsar_monitor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    add("USE tsar_monitor;")
    add("")
    add("SET NAMES utf8mb4;")
    add("SET CHARACTER_SET_CLIENT = utf8mb4;")
    add("SET CHARACTER_SET_CONNECTION = utf8mb4;")
    add("SET CHARACTER_SET_RESULTS = utf8mb4;")
    add("")
    add("-- 删除旧表（按外键依赖顺序）")
    add("SET FOREIGN_KEY_CHECKS = 0;")
    add("DROP TABLE IF EXISTS pref_tsar;")
    add("DROP TABLE IF EXISTS disk_tsar;")
    add("DROP TABLE IF EXISTS mod_detail;")
    add("DROP TABLE IF EXISTS host_detail;")
    add("SET FOREIGN_KEY_CHECKS = 1;")
    add("")
    add("-- 1. 主机维度表")
    add("CREATE TABLE host_detail (")
    add("  hostid     VARCHAR(16)  NOT NULL COMMENT '主机ID',")
    add("  hostname   VARCHAR(128) NOT NULL COMMENT '域名',")
    add("  owner      VARCHAR(32)  NOT NULL COMMENT '负责人',")
    add("  model      VARCHAR(64)  NOT NULL COMMENT '型号',")
    add("  location1  VARCHAR(32)  NOT NULL COMMENT '机房',")
    add("  location2  VARCHAR(32)  NOT NULL COMMENT '机柜',")
    add("  PRIMARY KEY (hostid)")
    add(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机维度表';")
    add("")
    add("-- 2. 指标维度表")
    add("CREATE TABLE mod_detail (")
    add("  `mod`  VARCHAR(32)  NOT NULL COMMENT '指标代码',")
    add("  type   VARCHAR(8)   NOT NULL COMMENT 'pref/disk',")
    add("  `desc` VARCHAR(64)  NOT NULL COMMENT '中文描述',")
    add("  unit   VARCHAR(16)  NOT NULL COMMENT '单位',")
    add("  tag    VARCHAR(32)  NOT NULL COMMENT '分组标签',")
    add("  PRIMARY KEY (`mod`)")
    add(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标维度表';")
    add("")
    add("-- 3. 性能时序事实表")
    add("CREATE TABLE pref_tsar (")
    add("  ts      BIGINT        NOT NULL COMMENT 'Unix毫秒时间戳',")
    add("  hostid  VARCHAR(16)   NOT NULL COMMENT '主机ID',")
    add("  type    VARCHAR(8)    NOT NULL DEFAULT 'pref',")
    add("  `mod`   VARCHAR(32)   NOT NULL COMMENT '指标代码',")
    add("  value   DECIMAL(16,4) NOT NULL COMMENT '采样值',")
    add("  tag     VARCHAR(32)   NOT NULL COMMENT '分组标签',")
    add("  PRIMARY KEY (ts, hostid, `mod`),")
    add("  KEY idx_hostid (hostid),")
    add("  KEY idx_mod (`mod`),")
    add("  KEY idx_tag (tag),")
    add("  CONSTRAINT fk_pref_host FOREIGN KEY (hostid) REFERENCES host_detail(hostid),")
    add("  CONSTRAINT fk_pref_mod  FOREIGN KEY (`mod`) REFERENCES mod_detail(`mod`)")
    add(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='性能时序事实表';")
    add("")
    add("-- 4. 磁盘时序事实表")
    add("CREATE TABLE disk_tsar (")
    add("  ts      BIGINT        NOT NULL COMMENT 'Unix毫秒时间戳',")
    add("  hostid  VARCHAR(16)   NOT NULL COMMENT '主机ID',")
    add("  type    VARCHAR(8)    NOT NULL DEFAULT 'disk',")
    add("  `mod`   VARCHAR(32)   NOT NULL COMMENT '指标代码',")
    add("  value   DECIMAL(16,4) NOT NULL COMMENT '采样值',")
    add("  tag     VARCHAR(32)   NOT NULL COMMENT '分组标签',")
    add("  PRIMARY KEY (ts, hostid, `mod`),")
    add("  KEY idx_hostid (hostid),")
    add("  KEY idx_mod (`mod`),")
    add("  KEY idx_tag (tag),")
    add("  CONSTRAINT fk_disk_host FOREIGN KEY (hostid) REFERENCES host_detail(hostid),")
    add("  CONSTRAINT fk_disk_mod  FOREIGN KEY (`mod`) REFERENCES mod_detail(`mod`)")
    add(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='磁盘时序事实表';")
    add("")

    hosts = load("host_detail.dat")
    add(f"-- host_detail 数据 ({len(hosts)} 行)")
    add("INSERT INTO host_detail (hostid, hostname, owner, model, location1, location2) VALUES")
    vals = [
        f"  ({esc(r['hostid'])}, {esc(r['hostname'])}, {esc(r['owner'])}, "
        f"{esc(r['model'])}, {esc(r['location1'])}, {esc(r['location2'])})"
        for r in hosts
    ]
    add(",\n".join(vals) + ";")
    add("")

    mods = load("mod_detail.dat")
    add(f"-- mod_detail 数据 ({len(mods)} 行)")
    add(f"INSERT INTO mod_detail ({qcols(['mod', 'type', 'desc', 'unit', 'tag'])}) VALUES")
    vals = [
        f"  ({esc(r['mod'])}, {esc(r['type'])}, {esc(r['desc'])}, {esc(r['unit'])}, {esc(r['tag'])})"
        for r in mods
    ]
    add(",\n".join(vals) + ";")
    add("")

    def batch_insert(table, rows, cols, batch=500):
        col_str = qcols(cols)
        for i in range(0, len(rows), batch):
            chunk = rows[i : i + batch]
            add(f"-- {table} 第 {i + 1}-{i + len(chunk)} 行")
            add(f"INSERT INTO {table} ({col_str}) VALUES")
            vals = []
            for r in chunk:
                parts = []
                for c in cols:
                    if c == "value":
                        parts.append(str(float(r[c])))
                    elif c == "ts":
                        parts.append(str(int(r[c])))
                    else:
                        parts.append(esc(r[c]))
                vals.append("  (" + ", ".join(parts) + ")")
            add(",\n".join(vals) + ";")
            add("")

    pref = load("pref_tsar.dat")
    add(f"-- pref_tsar 数据 ({len(pref)} 行)")
    batch_insert("pref_tsar", pref, ["ts", "hostid", "type", "mod", "value", "tag"])

    disk = load("disk_tsar.dat")
    add(f"-- disk_tsar 数据 ({len(disk)} 行)")
    batch_insert("disk_tsar", disk, ["ts", "hostid", "type", "mod", "value", "tag"])

    add("-- 导入完成，验证行数")
    add('SELECT "host_detail" AS tbl, COUNT(*) AS cnt FROM host_detail')
    add('UNION ALL SELECT "mod_detail", COUNT(*) FROM mod_detail')
    add('UNION ALL SELECT "pref_tsar", COUNT(*) FROM pref_tsar')
    add('UNION ALL SELECT "disk_tsar", COUNT(*) FROM disk_tsar;')

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated: {OUT}")
    print(f"Lines: {len(lines)}")
    print(f"Size: {OUT.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"host={len(hosts)}, mod={len(mods)}, pref={len(pref)}, disk={len(disk)}")


if __name__ == "__main__":
    main()
