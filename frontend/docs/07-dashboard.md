# Dashboard

This page explains what each metric in the **Dashboard** module means. The content was cross-checked against the on-screen help text in `app/ui/views/dashboard_view.py`, the collection logic in `app/services/dashboard_service.py`, and the SQL definitions in `app/database/queries/dashboard_queries.py`.

The Dashboard is a high-level monitoring screen. It is designed to give a quick view of **CPU**, **memory**, **workload**, **IO**, and **TempDB** conditions on a connected SQL Server instance. As the subtitle in the UI states, rate-based metrics are averaged over the last refresh interval.

## 1. General Behavior

- `Batch/sec`, `Transactions/sec`, `Compilations/sec`, and `Recomp/sec` are derived from cumulative SQL Server counters using a **delta / elapsed time** calculation.
- Because of that, the first refresh may temporarily show `0` for these rate metrics until a baseline sample exists.
- The Dashboard is intended for fast triage, not full root-cause analysis. If a metric looks abnormal, it should be followed by deeper investigation in the relevant module or in SQL Server tooling.

## 2. Server Health

| Metric | Summary | Code / Data Source | UI Interpretation |
| --- | --- | --- | --- |
| `CPU %` | Shows total operating system CPU utilization. Use it to see whether the host itself is CPU-bound, including pressure from non-SQL processes. | Calculated from `sys.dm_os_ring_buffers` using `100 - system_idle`. | `<70` normal, `70-89` warning, `>=90` bad |
| `SQL CPU %` | Shows CPU utilization for the SQL Server process. If this is high, CPU-heavy queries, parallelism, or compile/recompile activity may be contributing. | Read from the same ring buffer record using `ProcessUtilization`. | `<70` normal, `70-89` warning, `>=90` bad |
| `Active Sessions` | Counts currently active user sessions. Sudden increases may indicate connection storms, long-running requests, or application pooling issues. | Queried from `sys.dm_exec_sessions`; only `is_user_process = 1`, `session_id > 50`, and `status in ('running','runnable')` are counted. `SQLAgent`, `DatabaseMail`, and `Report Server` sessions are excluded. | `<50` normal, `50-99` warning, `>=100` bad |
| `Runnable Queue` | Shows CPU scheduler pressure. When tasks are ready to run but cannot get CPU time, this value rises and becomes a strong CPU bottleneck signal. | Calculated from `sys.dm_os_schedulers` as `SUM(max(current_tasks_count - active_workers_count, 0))`. | `<5` good, `5-19` warning, `>=20` bad |

## 3. Memory Health

| Metric | Summary | Code / Data Source | UI Interpretation |
| --- | --- | --- | --- |
| `Total Memory` | Shows how much memory SQL Server has currently committed for its memory manager. In a steady state, it usually approaches `Target Memory`. | Read from the `Total Server Memory (KB)` performance counter and converted to MB. | `Total / Target >= 0.90` good, `0.75-0.89` warning, `<0.75` bad |
| `Target Memory` | Shows how much memory SQL Server wants to use under current conditions. It should be interpreted together with `Total Memory`. | Read from the `Target Server Memory (KB)` performance counter. | No separate alert threshold is currently applied in the UI |
| `PLE` | `Page Life Expectancy` estimates how long a data page stays in the buffer pool. Sharp drops can indicate buffer churn or memory pressure. | Read from the `Page life expectancy` performance counter. | `>300` good, `61-300` warning, `<=60` bad |
| `Buffer Hit Ratio` | Shows how often reads are served from memory instead of disk. Trend is usually more meaningful than a single snapshot. | Derived from `Buffer cache hit ratio` and `Buffer cache hit ratio base` counters. | `>95` good, `91-95` warning, `<=90` bad |

## 4. Workload

| Metric | Summary | Code / Data Source | UI Interpretation |
| --- | --- | --- | --- |
| `Batch/sec` | A high-level throughput signal that reflects how many batches SQL Server is processing. Spikes often correlate with higher CPU and IO demand. | Reads the cumulative `Batch Requests/sec` counter and converts it to a per-second rate over the refresh interval. | No alert threshold is currently applied in the UI |
| `Transactions/sec` | Shows transactional throughput. Comparing it with `Batch/sec` helps distinguish request volume from true transaction activity. | Reads the cumulative `Transactions/sec` counter from the `_Total` instance and converts it to a rate over the refresh interval. | No alert threshold is currently applied in the UI |
| `Compilations/sec` | Shows how often SQL Server is compiling plans. High values relative to `Batch/sec` can indicate ad-hoc workloads, weak parameterization, or plan cache churn. | Reads the cumulative `SQL Compilations/sec` counter and converts it to a rate over the refresh interval. | `<1000` normal, `1000-4999` warning, `>=5000` bad |
| `Recomp/sec` | Shows how often plans are being recompiled. Sustained increases can add CPU overhead and point to plan stability issues. | Reads the cumulative `SQL Re-Compilations/sec` counter and converts it to a rate over the refresh interval. | `0` good, `1-99` warning, `>=100` bad |

## 5. IO

| Metric | Summary | Code / Data Source | UI Interpretation |
| --- | --- | --- | --- |
| `IO Read Latency` | Shows average read latency in milliseconds. High values can indicate storage pressure or read-heavy random IO patterns. | Calculated from `sys.dm_io_virtual_file_stats` as average `io_stall_read_ms / num_of_reads`. | `<5 ms` good, `5-19 ms` warning, `>=20 ms` bad |
| `IO Write Latency` | Shows average write latency in milliseconds. Sustained increases can affect checkpoint activity, TempDB behavior, and overall throughput. | Calculated from `sys.dm_io_virtual_file_stats` as average `io_stall_write_ms / num_of_writes`. | `<5 ms` good, `5-19 ms` warning, `>=20 ms` bad |
| `Log Write Latency` | Shows write latency for transaction log files only. This is especially important when commit latency or `WRITELOG` waits are suspected. | Calculated from `sys.dm_io_virtual_file_stats` joined with `sys.master_files`, filtered to `type_desc = 'LOG'`. | `<5 ms` good, `5-19 ms` warning, `>=20 ms` bad |
| `Disk Queue Length` | A best-effort proxy for pending IO requests. Sustained higher values suggest that the storage layer is falling behind demand. | Counted from `sys.dm_io_pending_io_requests`. The code explicitly treats this metric as a best-effort proxy. | `<2` good, `2-9` warning, `>=10` bad |

## 6. TempDB

| Metric | Summary | Code / Data Source | UI Interpretation |
| --- | --- | --- | --- |
| `TempDB Usage` | Shows the percentage of TempDB data file space currently in use. High values may be caused by temp tables, spills, version store growth, or large index operations. | Calculated from `tempdb.sys.dm_db_file_space_usage` as used pages versus total pages. | `<50` good, `50-79` warning, `>=80` bad |
| `TempDB Log Used` | Shows TempDB transaction log utilization. Rapid growth can point to long-running transactions or heavy version store activity. | Read from `tempdb.sys.dm_db_log_space_usage` using `used_log_space_in_percent`. | `<50` good, `50-79` warning, `>=80` bad |
| `PFS/GAM Waits` | A TempDB allocation contention signal. Non-zero values suggest waits on allocation bitmap pages. | Counted from `sys.dm_os_waiting_tasks` for `PAGELATCH_%` waits where `database_id = 2` and `page_id in (1,2,3)`. | `0` good, `1-9` warning, `>=10` bad |

## 7. Quick Interpretation Guide

- If `CPU %` is high but `SQL CPU %` is low, the pressure is more likely coming from a non-SQL process.
- If `SQL CPU %` and `Runnable Queue` are both high, CPU pressure inside SQL Server is more likely to be real.
- If `Total Memory`, `PLE`, and `Buffer Hit Ratio` all deteriorate together, buffer pool pressure should be investigated.
- If `Compilations/sec` or `Recomp/sec` rises, review plan cache behavior and query design.
- If `IO Read Latency`, `IO Write Latency`, `Log Write Latency`, and `Disk Queue Length` are elevated together, storage latency is a likely factor.
- If `TempDB Usage`, `TempDB Log Used`, and `PFS/GAM Waits` increase together, review TempDB sizing, file layout, and spill-heavy workloads.

## 8. Cross-Check Notes

- Metric ordering and built-in help text are defined in `app/ui/views/dashboard_view.py`.
- Status and color thresholds are applied in `_apply_metrics()` in `app/ui/views/dashboard_view.py`.
- Metric collection and rate calculations are implemented in `app/services/dashboard_service.py`.
- SQL query definitions and base DMV sources are stored in `app/database/queries/dashboard_queries.py`.

This document reflects the current implementation. If Dashboard metrics or thresholds change in code, this page should be updated in the same change set.
