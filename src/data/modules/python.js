export const pythonModule = {
  sections: [
    {
      title: 'Variables & Data Types',
      subtopics: [
        {
          id: 'python-variables',
          title: 'Variables',
          difficulty: 'beginner',
          explanation: 'A variable stores a value under a name so you can reference and reuse it later.',
          why: 'Data engineers use variables to hold file paths, table names, row counts, and configuration values.',
          syntax: `table_name = "orders"\nrow_count = 1500\nis_active = True`,
          example: `source = "s3://bucket/sales/2024-01-15.csv"\ntarget = "warehouse.sales"\n\nprint(f"Loading {source} into {target}")`,
          expectedOutput: 'Loading s3://bucket/sales/2024-01-15.csv into warehouse.sales',
          interview: {
            question: 'What is a variable in Python?',
            answer: 'A named container that holds a value. Python infers the type automatically from the assigned value.',
          },
        },
        {
          id: 'python-lists-dicts',
          title: 'Lists & Dictionaries',
          difficulty: 'beginner',
          explanation: 'A list holds multiple ordered values. A dictionary maps keys to values for fast lookup.',
          why: 'Lists store multiple file paths or column names. Dicts store row data as column-to-value mappings.',
          syntax: `files = ["jan.csv", "feb.csv", "mar.csv"]\nrow = {"order_id": 101, "amount": 250}`,
          example: `columns = ["order_id", "amount", "status"]\nfor col in columns:\n    print(f"  - {col}")\n\nrow = {"order_id": 101, "status": "shipped"}\nprint(row["status"])`,
          expectedOutput: '  - order_id\n  - amount\n  - status\nshipped',
          interview: {
            question: 'When would you use a list vs a dictionary in a pipeline?',
            answer: 'List for ordered sequences (file names, column lists). Dict for structured row data where you look up values by name.',
          },
        },
        {
          id: 'python-functions',
          title: 'Writing Functions',
          difficulty: 'beginner',
          explanation: 'A function groups reusable logic under a name. You call it whenever that logic is needed.',
          why: 'Data engineers write functions to clean columns, validate rows, parse dates, and standardise values.',
          syntax: `def clean_name(name):\n    return name.strip().title()\n\ndef is_valid(row):\n    return row["amount"] is not None and row["amount"] > 0`,
          example: `def clean_row(row):\n    row["name"] = row["name"].strip().title()\n    row["amount"] = round(float(row["amount"]), 2)\n    return row\n\nraw = {"name": "  alice ", "amount": "99.987"}\nprint(clean_row(raw))`,
          expectedOutput: "{'name': 'Alice', 'amount': 99.99}",
          interview: {
            question: 'Why wrap cleaning logic in a function instead of writing it inline?',
            answer: 'Functions are reusable, testable, and easier to update. If the cleaning rule changes, you fix one place.',
          },
        },
      ],
    },
    {
      title: 'Working with Files & APIs',
      subtopics: [
        {
          id: 'python-read-csv',
          title: 'Reading CSV Files',
          difficulty: 'beginner',
          explanation: 'Python reads CSV files row by row using the csv module or pandas.',
          why: 'Most raw data arrives as CSV files from reports, exports, or FTP drops that need processing.',
          syntax: `import csv\nwith open("data.csv") as f:\n    reader = csv.DictReader(f)\n    for row in reader:\n        print(row)`,
          example: `import csv\n\ntotal = 0\nwith open("orders.csv") as f:\n    for row in csv.DictReader(f):\n        if row["status"] == "shipped":\n            total += float(row["amount"])\n\nprint(f"Shipped total: {total}")`,
          expectedOutput: 'Shipped total: 844.0',
          interview: {
            question: 'Why use csv.DictReader instead of csv.reader?',
            answer: 'DictReader maps each row to a dict using the header row as keys, so you access values by column name rather than index.',
          },
        },
        {
          id: 'python-write-output',
          title: 'Writing Output Files',
          difficulty: 'beginner',
          explanation: 'Python writes cleaned or transformed data to CSV, JSON, or text files for downstream steps.',
          why: 'After processing, you persist the result as a file to pass to the next pipeline stage or load into a database.',
          syntax: `import csv\nwith open("output.csv", "w", newline="") as f:\n    writer = csv.DictWriter(f, fieldnames=["id", "amount"])\n    writer.writeheader()\n    writer.writerows(rows)`,
          example: `import json\n\nclean_records = [\n    {"id": 1, "amount": 150.0, "status": "shipped"},\n    {"id": 2, "amount": 89.0,  "status": "pending"},\n]\n\nwith open("clean_orders.json", "w") as f:\n    json.dump(clean_records, f, indent=2)\n\nprint(f"Wrote {len(clean_records)} records")`,
          expectedOutput: 'Wrote 2 records',
          interview: {
            question: 'What does "w" mode do when opening a file, and what is the risk?',
            answer: '"w" creates the file or overwrites it completely. The risk: if the job fails mid-write you may lose the previous good output.',
          },
        },
      ],
    },
  ],
};
