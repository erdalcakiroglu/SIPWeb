# Object Explorer Module -- Technical Documentation

## 1. Overview

The Object Explorer module is a centralized discovery and analysis
component designed to list and analyze database objects within a
selected Microsoft SQL Server database.

Supported object types:

-   Stored Procedures\
-   Views\
-   Functions\
-   Tables\
-   Triggers

This module serves as the primary entry point for:

-   Source code inspection\
-   Performance statistics analysis\
-   Dependency analysis\
-   AI-assisted performance evaluation

------------------------------------------------------------------------

## 2. Operating Principles and Security Model

Object Explorer operates under the following principles:

-   Runs in **read-only** mode.\
-   Does not execute any DDL or DML statements.\
-   Does not access user-level row data.\
-   Does not create, modify, or drop schema objects or indexes.\
-   The AI Tune feature generates recommendations only and does not
    apply automatic changes.

This design ensures safe operation in regulated, security-sensitive, and
enterprise environments.

------------------------------------------------------------------------

## 3. Architectural Structure

The Object Explorer interface consists of two main sections:

### 3.1 Navigation & Filtering Panel (Left Panel)

This section:

-   Displays database objects from the selected database.\
-   Provides an Object Type filter to narrow results.\
-   Includes a search box for object name filtering.

Objects are listed using system catalog views and displayed in the
format:

    schema.object_name

------------------------------------------------------------------------

### 3.2 Detail Tabs (Right Panel)

When an object is selected from the left panel, the following tabs
become available:

#### ▸ Source Code

Displays:

-   The definition (script) for Stored Procedures, Views, and
    Functions.\
-   A best-effort generated CREATE TABLE script for Tables.

------------------------------------------------------------------------

#### ▸ Statistics

Depending on object type, the following metrics are presented:

**For Stored Procedures / Views / Functions:**

-   Execution count\
-   Average elapsed time\
-   CPU usage\
-   Logical and physical reads\
-   Last execution time

**For Tables:**

-   Row count\
-   Total size\
-   Column count\
-   Index count\
-   Index usage statistics

These metrics provide insight into workload intensity and object-level
performance characteristics.

------------------------------------------------------------------------

#### ▸ Relations

Displays:

-   Objects that the selected object depends on (Depends On)\
-   Objects that reference the selected object (Used By)

This enables:

-   Dependency chain analysis\
-   Impact assessment\
-   Risk evaluation prior to refactoring or deployment

------------------------------------------------------------------------

#### ▸ AI Tune

The AI Tune tab:

-   Collects the selected object's source code\
-   Gathers performance statistics\
-   Aggregates index and metadata information\
-   Builds a structured context

This context is sent to the configured AI model for analysis.

The AI model evaluates:

-   Performance bottlenecks\
-   Index optimization opportunities\
-   SQL anti-patterns\
-   Parameter sniffing risks\
-   I/O and resource consumption issues

The analysis results are presented as a structured report within the
application.

AI Tune provides advisory output only and does not modify the database.

------------------------------------------------------------------------

## 4. Example Usage Workflow

A typical analysis process follows these steps:

1.  Select the target database.\
2.  Filter by object type if necessary.\
3.  Locate the object using the search box.\
4.  Review the Source Code.\
5.  Analyze workload and metrics in the Statistics tab.\
6.  Evaluate dependency relationships in the Relations tab.\
7.  Initiate AI Tune for deep performance diagnostics.

This structured workflow supports systematic and controlled SQL
performance investigation.
