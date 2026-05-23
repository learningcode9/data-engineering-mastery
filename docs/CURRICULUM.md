# Curriculum

The platform includes a 39-topic curriculum organized into eight phases. Each topic is normalized with consistent fields for the UI:

- `id`
- `title`
- `phase`
- `category`
- `difficulty`
- `estimatedTime`
- `prerequisites`
- `whyItMatters`
- `learningObjectives`
- `realWorldUseCase`
- `commonMistakes`
- `practiceTasks`
- `interviewQuestions`
- `miniProject`
- `nextStep`

## Foundation

1. SQL
2. Python
3. Linux & Command Line
4. Git & Version Control
5. Data Modeling

## Pipeline

6. ETL vs ELT
7. Batch Processing
8. Incremental Loading
9. CDC
10. Data Quality

## Big Data

11. PySpark
12. Spark Optimization
13. Partitioning
14. File Formats
15. Delta Lake

## Cloud & Storage

16. ADLS / S3
17. Azure Data Factory
18. Databricks
19. AWS Glue
20. Medallion Architecture

## Streaming

21. Kafka
22. Structured Streaming
23. Event Hubs
24. Checkpointing & Watermarking

## Production

25. Orchestration
26. Monitoring & Logging
27. Retry & Failure Recovery
28. CI/CD for Data Engineering
29. Security & Governance
30. Unity Catalog / RBAC

## Career

31. Real-world Projects
32. Resume Builder
33. Interview Preparation
34. Mock Interviews
35. Production Scenarios

## AI

36. AI for Data Engineers
37. LLM-assisted Pipelines
38. Vector Databases
39. AI-powered Analytics

## Data Files

- Main export: `src/data/topics.js`
- Added curriculum: `src/data/newTopics.js`
- Phases: `src/data/phases.js`
- Detailed modules: `src/data/modules/`

## Integration Notes

The original seven deep modules remain intact. The expanded curriculum is merged into the main `topics` export through a normalization layer so dashboard recommendations, topic cards, search, roadmap phases, and progress tracking can read one consistent data shape.
