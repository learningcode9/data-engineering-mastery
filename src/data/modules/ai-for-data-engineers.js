export const aiModule = {
  sections: [
    {
      title: 'Prompting Effectively',
      subtopics: [
        {
          id: 'ai-prompt-basics',
          title: 'Writing Good Prompts',
          difficulty: 'beginner',
          explanation: 'A good prompt gives the AI role, context, and a specific task. Vague prompts produce generic answers.',
          why: 'A well-structured prompt saves time — you get a useful answer on the first try rather than rephrasing multiple times.',
          syntax: `Template:\n  Role:    "You are a data engineer working with SQL Server"\n  Context: "I have an orders table with columns: order_id, amount, status, created_at"\n  Task:    "Write a query that finds customers who placed more than 3 orders in January"\n  Format:  "Show the SQL with a short explanation"`,
          example: `Weak prompt:\n  "Write a query for orders"\n\nStrong prompt:\n  "You are a data engineer using PostgreSQL.\n   Table: orders (order_id, customer_id, amount, status, created_at)\n   Task: Return the top 5 customers by total spend in Jan 2024.\n   Include: customer_id, total_amount, order_count.\n   Sort by total_amount descending."`,
          expectedOutput: 'Strong prompt produces ready-to-use SQL with correct column names and logic.',
          interview: {
            question: 'What information should you always include when asking AI to write SQL?',
            answer: 'The database dialect (PostgreSQL, MySQL, BigQuery), exact table and column names, the business question in plain words, and the expected output shape.',
          },
        },
        {
          id: 'ai-explain-debug',
          title: 'Explain & Debug with AI',
          difficulty: 'beginner',
          explanation: 'AI can explain complex queries in plain English, find bugs, and suggest optimisations in seconds.',
          why: 'Reviewing inherited code or debugging a slow query is faster when you can ask AI to explain what each part does.',
          syntax: `Explain:\n  "Explain this query line by line in plain English: [paste query]"\n\nDebug:\n  "This query returns wrong results. Expected: X, Got: Y. What is wrong? [paste query]"\n\nOptimise:\n  "This query takes 45 seconds. Suggest ways to make it faster. [paste query + table info]"`,
          example: `Prompt:\n  "Explain what this SQL does and flag any potential issues:\n\n   SELECT c.name, SUM(o.amount)\n   FROM customers c, orders o\n   WHERE c.id = o.customer_id\n   GROUP BY c.name"\n\nAI response:\n  "This is a Cartesian join written in old syntax (comma instead of JOIN).\n   It works but is harder to read. Modern equivalent:\n   SELECT c.name, SUM(o.amount)\n   FROM customers c\n   JOIN orders o ON c.id = o.customer_id\n   GROUP BY c.name"`,
          expectedOutput: 'AI explains the query and flags the old comma-join syntax.',
          interview: {
            question: 'Should you trust AI-generated SQL without testing it?',
            answer: 'No. Always run AI SQL on a dev environment first. AI can hallucinate column names or produce logically incorrect joins. Treat it as a starting point, not a final answer.',
          },
        },
      ],
    },
    {
      title: 'AI in Your Daily Workflow',
      subtopics: [
        {
          id: 'ai-pipeline-tasks',
          title: 'AI for Pipeline Work',
          difficulty: 'beginner',
          explanation: 'AI accelerates repetitive pipeline tasks: writing boilerplate, converting code between languages, and generating test data.',
          why: 'Tasks that took 30 minutes — like converting a SQL query to PySpark or writing unit tests — now take 2 minutes with AI assistance.',
          syntax: `Useful prompts:\n  "Convert this SQL aggregation to PySpark DataFrame API: [SQL]"\n  "Generate 10 rows of realistic test data for this schema: [columns]"\n  "Write a Python function to validate this CSV schema: [columns + types]"\n  "Write a Markdown runbook for this pipeline: [steps]"`,
          example: `Prompt:\n  "Convert this SQL to PySpark:\n   SELECT status, COUNT(*) as cnt, SUM(amount) as total\n   FROM orders\n   WHERE created_at >= '2024-01-01'\n   GROUP BY status"\n\nAI output:\n  from pyspark.sql.functions import count, sum, col\n\n  result = orders_df \\\n      .filter(col("created_at") >= "2024-01-01") \\\n      .groupBy("status") \\\n      .agg(count("*").alias("cnt"), sum("amount").alias("total"))`,
          expectedOutput: 'PySpark equivalent produced in seconds, ready to test.',
          interview: {
            question: 'Name three data engineering tasks where AI saves the most time.',
            answer: '1. Writing boilerplate ingestion code. 2. Translating queries between SQL dialects. 3. Generating documentation and runbooks from existing code.',
          },
        },
        {
          id: 'ai-learning-tool',
          title: 'AI as a Learning Partner',
          difficulty: 'beginner',
          explanation: 'AI can generate practice questions, quiz you on concepts, and explain topics at any depth — acting as a personalised tutor.',
          why: 'Learning a new tool like Spark or Databricks is faster when you can ask unlimited "why" and "what if" questions at any time.',
          syntax: `Learning prompts:\n  "Quiz me on SQL window functions — give me 5 questions one at a time"\n  "Explain partitioning to me like I have never heard of it"\n  "What is the most common mistake people make with GROUP BY? Give an example"\n  "Give me a real-world scenario where I would use a CTE vs a subquery"`,
          example: `Learning session example:\n\n  You: "Quiz me on PySpark joins"\n  AI:  "Question 1: What is the difference between\n        an inner join and a left join in PySpark?\n        Write the PySpark syntax for each."\n\n  You: [writes answer]\n\n  AI:  "Correct! Here is a small improvement:\n        In PySpark you can also write .join(df2, 'column')\n        as shorthand when both DFs share the column name."\n        Next question: When would you use a broadcast join?"\n`,
          expectedOutput: 'Interactive quiz session with instant feedback.',
          interview: {
            question: 'What is the risk of using AI to learn a technical topic?',
            answer: 'AI can state incorrect facts confidently. Always verify answers against official documentation, especially for version-specific behaviour or edge cases.',
          },
        },
      ],
    },
  ],
};
