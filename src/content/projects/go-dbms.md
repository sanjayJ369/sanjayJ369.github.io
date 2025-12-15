---
title: "GoDBMS"
description: "Understanding Database Internals: A Step-by-Step Implementation"
date: "13-06-2025"
image: "/assets/go-dbms/image.png"
tags: [database, golang, btree, sql]
repolink: "https://github.com/sanjayJ369/GoDBMS"
---

# GoDBMS: Demystifying Database Internals

## The Idea

The primary goal of the **GoDBMS** project was to gain a deep understanding of **database internals**. This included exploring fundamental concepts such as how data is **stored on disks**, the mechanisms behind data **processing**, and the importance of **indexing**.

---

## Demo

Check out a short demo of GoDBMS in action:

<video controls width="100%">
  <source src="/assets/go-dbms/video-1.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

---

## The Process

**GoDBMS** was developed through a systematic, step-by-step approach:

1.  **Basic Storage System**: The initial phase involved creating a foundational storage system. This was built upon a **B-tree-based key-value store**, providing an efficient way to manage data.
2.  **Multi-column Table Support**: Next, the system was enhanced to support **tables with multiple columns**, moving beyond simple key-value pairs to more complex data structures.
3.  **CRUD Operations**: Core database operations were then implemented, including **inserting, updating, deleting, and upserting data**, allowing for comprehensive data manipulation.
4.  **Secondary Indexes**: To significantly improve **query performance**, **secondary indexes** were integrated, enabling faster data retrieval based on various criteria.
5.  **SQL-like Query Language**: Finally, a **simple SQL-like query language** was developed. This made interacting with the database much more intuitive and user-friendly, allowing for more expressive data queries.

The entire process was geared towards gaining practical insights into the inner workings of databases, from low-level data storage to high-level query processing.

---

## Features

**GoDBMS** boasts the following key features:

- **B-tree-based key-value store**: Efficient and ordered data storage.
- **Support for tables with multiple columns**: Enables structured data organization.
- **Insert, update, delete, and upsert operations**: Full data manipulation capabilities.
- **Secondary indexes for faster queries**: Optimizes data retrieval.
- **SQL-like query language**: Simplifies database interaction.

---
