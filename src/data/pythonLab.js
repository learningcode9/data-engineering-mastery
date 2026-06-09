// ── Python Practice Lab — V1 data ────────────────────────────────────────────
// 4 exercises + Python interview mode for mock simulator

export const PYTHON_LAB_EXERCISES = [

  // ─── Exercise 1: Safe CSV Ingestion ─────────────────────────────────────────
  {
    id: 'py-ex-01',
    number: 1,
    title: 'Safe CSV Ingestion',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    tags: ['File I/O', 'Error Handling', 'Pandas'],
    scenario:
      'You are building an ingestion script that reads a sales CSV dropped by a vendor onto ADLS each morning. The file sometimes does not arrive, sometimes has malformed rows, and occasionally uses the wrong delimiter. Your pipeline must handle all three cases without crashing and surface a clear, specific message for each failure mode.',
    objective:
      'Implement read_sales_csv(filepath) that returns a cleaned DataFrame or raises IngestionError with a descriptive message.',
    starterCode: `import pandas as pd


class IngestionError(Exception):
    """Raised when a CSV file cannot be safely ingested."""
    pass


def read_sales_csv(filepath: str) -> pd.DataFrame:
    """
    Read a vendor sales CSV and return a cleaned DataFrame.

    Returns:
        DataFrame with fully-null rows dropped.

    Raises:
        IngestionError: If the file is missing, malformed, or unreadable.
    """
    # TODO: Implement safe CSV reading
    # 1. Use specific exception types — not bare 'except Exception'
    # 2. Handle FileNotFoundError (file not delivered by vendor)
    # 3. Handle pd.errors.ParserError (wrong delimiter or bad encoding)
    # 4. Drop rows that are entirely null before returning
    # 5. Raise IngestionError with a descriptive message from each except block
    pass


# ─── Test it ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Requires: 'sales.csv' (valid), 'missing.csv' (absent), 'bad.csv' (malformed)

    df = read_sales_csv('sales.csv')
    print(f'Case 1 — Valid: {df.shape} rows loaded')

    try:
        read_sales_csv('missing.csv')
    except IngestionError as e:
        print(f'Case 2 — Missing: {e}')

    try:
        read_sales_csv('bad.csv')
    except IngestionError as e:
        print(f'Case 3 — Malformed: {e}')
`,
    hints: [
      'Wrap pd.read_csv() in a try block with two separate except clauses — one for FileNotFoundError and one for pd.errors.ParserError. Catch them specifically, not with a broad "except Exception".',
      'In each except block, raise IngestionError(f"...message...") from e. The "from e" chain links the original exception as context — interviewers and on-call engineers both value this.',
    ],
    expectedOutput: `Case 1 — Valid: (247, 5) rows loaded
Case 2 — Missing: File not found: missing.csv
Case 3 — Malformed: Parse error in bad.csv — check delimiter or encoding`,
    commonMistakes: [
      'Using bare "except:" or "except Exception:" instead of specific exception types. This hides the cause of failure and makes debugging a 3am incident much harder.',
      'Forgetting df.dropna(how="all") — vendor files often contain trailing blank rows that cause downstream KeyErrors in transformation steps.',
      'Raising a generic RuntimeError instead of the custom IngestionError — callers cannot catch a specific type to handle it differently from other errors.',
    ],
    interviewConnection:
      'Specific exception handling over broad except blocks is the first code review comment a senior engineer makes on junior ETL code. Demonstrating this pattern signals production-readiness.',
    solutionCode: `import pandas as pd


class IngestionError(Exception):
    pass


def read_sales_csv(filepath: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(filepath)
    except FileNotFoundError as e:
        raise IngestionError(f"File not found: {filepath}") from e
    except pd.errors.ParserError as e:
        raise IngestionError(
            f"Parse error in {filepath} — check delimiter or encoding"
        ) from e
    return df.dropna(how='all')
`,
    solutionAnnotations: [
      'Two separate except clauses: each failure mode has its own handler. FileNotFoundError and ParserError have different causes and require different on-call responses.',
      '"raise ... from e" chains the original exception as context. The full stack trace is preserved in logs. Without this, the root cause disappears behind your custom exception.',
      'dropna(how="all") removes rows where every column is null — common in vendor CSVs with trailing blank lines.',
    ],
  },

  // ─── Exercise 2: API Ingestion with Retry ────────────────────────────────────
  {
    id: 'py-ex-02',
    number: 2,
    title: 'API Ingestion with Retry',
    difficulty: 'Beginner-Intermediate',
    estimatedMinutes: 20,
    tags: ['API', 'Retry Logic', 'Resilience'],
    scenario:
      'You are writing a function that calls a paginated REST API to fetch customer records. The API is unreliable — it returns 429 (rate limit) and 503 (server unavailable) errors intermittently. Your function must retry with exponential backoff and give up cleanly after a configurable number of attempts.',
    objective:
      'Implement fetch_records(url, max_retries, base_delay) with exponential backoff for transient errors and a clean failure mode.',
    starterCode: `import time
import requests


class MaxRetriesExceeded(Exception):
    """Raised when all retry attempts have been exhausted."""
    pass


RATE_LIMIT = 429
SERVER_ERROR = 503


def fetch_records(
    url: str,
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> list:
    """
    Fetch records from a REST API with exponential backoff retry.

    Returns:
        List of record dicts from the API JSON response.

    Raises:
        MaxRetriesExceeded: When all attempts have been used up.
    """
    # TODO: Implement retry with exponential backoff
    # 1. Loop max_retries times using range() — gives you the attempt index
    # 2. Make a GET request and check response.status_code
    # 3. Return response.json() immediately on status 200
    # 4. On 429 (rate limit): sleep base_delay * 2 before retrying
    # 5. On 503 (server error): sleep base_delay * (2 ** attempt) — exponential
    # 6. After the loop ends without a 200: raise MaxRetriesExceeded
    pass


# ─── Test it ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Replace with a real API endpoint or mock server to test
    try:
        records = fetch_records('https://api.example.com/customers')
        print(f'Fetched {len(records)} records')
    except MaxRetriesExceeded as e:
        print(f'Failed: {e}')
`,
    hints: [
      'Structure the retry as "for attempt in range(max_retries):" — this gives the attempt number (0, 1, 2) which drives the exponential backoff and terminates automatically. Only return or raise inside this loop.',
      'After the for loop ends without hitting a return, the next line executes. Place "raise MaxRetriesExceeded(f\'Failed after {max_retries} attempts\')" after the loop — not inside it.',
    ],
    expectedOutput: `# Scenario 1: succeeds on first try
Fetched 50 records

# Scenario 2: two 503s then success (attempt 0: sleep 1s, attempt 1: sleep 2s, attempt 2: 200)
Fetched 50 records

# Scenario 3: all attempts return 503
MaxRetriesExceeded: Failed after 3 attempts`,
    commonMistakes: [
      'Using "while True" with a counter instead of "for attempt in range(max_retries)". The range() form prevents infinite loops by construction and gives you the attempt index for free.',
      'Using the same backoff delay for 429 and 503. Rate limits have a fixed window (usually 60s); server errors recover faster. Distinguish them — this shows awareness of HTTP semantics.',
      'Forgetting idempotency: if the request partially succeeded before the retry, you may create duplicate data. For write operations, ensure the endpoint is idempotent or use checkpointing.',
    ],
    interviewConnection:
      '"How do you make an API call resilient?" is asked in every Azure DE screen involving ADF custom activities, Azure Functions, or ingestion scripts. Retry with exponential backoff plus the idempotency caveat is the complete senior answer.',
    solutionCode: `import time
import requests


class MaxRetriesExceeded(Exception):
    pass


RATE_LIMIT = 429
SERVER_ERROR = 503


def fetch_records(
    url: str,
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> list:
    for attempt in range(max_retries):
        response = requests.get(url)

        if response.status_code == 200:
            return response.json()

        if response.status_code == RATE_LIMIT:
            time.sleep(base_delay * 2)
        elif response.status_code == SERVER_ERROR:
            time.sleep(base_delay * (2 ** attempt))

    raise MaxRetriesExceeded(f"Failed after {max_retries} attempts")
`,
    solutionAnnotations: [
      '"for attempt in range(max_retries):" gives the attempt index (0-based) and terminates automatically — no risk of an infinite loop.',
      'Return immediately on 200 — do not continue the loop or collect results before returning.',
      'Named constants RATE_LIMIT and SERVER_ERROR make the HTTP semantics clear at a glance. Magic numbers in retry logic are a common review flag.',
      '"raise" after the loop exits without a return — this is the only path to MaxRetriesExceeded.',
    ],
  },

  // ─── Exercise 3: Pandas Transformation Pipeline ──────────────────────────────
  {
    id: 'py-ex-03',
    number: 3,
    title: 'Pandas Transformation Pipeline',
    difficulty: 'Intermediate',
    estimatedMinutes: 25,
    tags: ['Pandas', 'Data Cleaning', 'Silver Layer'],
    scenario:
      'You receive a raw Bronze-layer DataFrame of transaction records. Column names are inconsistent (mixed case, spaces), dates are strings, the amount column sometimes contains negatives (data entry errors), and customer_id has nulls that must be dropped before Silver loading. Implement the full cleaning pipeline.',
    objective:
      'Implement clean_transactions(df) that returns a standardized DataFrame without mutating the input.',
    starterCode: `import pandas as pd


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize a raw Bronze-layer transactions DataFrame for Silver loading.

    Args:
        df: Raw DataFrame from the Bronze layer.

    Returns:
        Cleaned DataFrame ready for Silver. The input DataFrame is NOT modified.

    Transformations required:
        1. Normalize column names: lowercase, replace spaces with underscores
        2. Cast transaction_date to datetime (coerce parse errors to NaT)
        3. Drop rows where customer_id is null
        4. Remove rows where amount is negative
    """
    # TODO: Implement all four transformations
    # CRITICAL: Start with result = df.copy() — never mutate the caller's DataFrame
    # Hint: df.columns.str.lower().str.replace(' ', '_', regex=False)
    # Hint: pd.to_datetime(col, errors='coerce') turns bad dates into NaT silently
    pass


# ─── Test it ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    raw = pd.DataFrame({
        'Customer ID':       [101, 102, None, 104],
        'Transaction Date':  ['2024-01-15', 'bad-date', '2024-01-17', '2024-01-18'],
        'Amount':            [250.0, -10.0, 300.0, 175.5],
        'Product':           ['Widget', 'Gadget', 'Widget', 'Gadget'],
    })

    result = clean_transactions(raw)

    print('Output columns:', result.columns.tolist())
    print('Row count:', len(result))
    print('transaction_date dtype:', result['transaction_date'].dtype)
    print('Input unchanged — original columns:', raw.columns.tolist())
`,
    hints: [
      'Call "result = df.copy()" on the very first line of the function body. Every transformation works on result, not df. This is not optional — mutating a caller\'s DataFrame is a silent production bug that causes wrong data on pipeline reruns.',
      'Assign the normalized names back: "result.columns = result.columns.str.lower().str.replace(\' \', \'_\', regex=False)". Then do each transformation in sequence. Use dropna(subset=[\'customer_id\']) not dropna() — you only want to drop rows missing the key, not rows with NaT dates.',
    ],
    expectedOutput: `Output columns: ['customer_id', 'transaction_date', 'amount', 'product']
Row count: 2
transaction_date dtype: datetime64[ns]
Input unchanged — original columns: ['Customer ID', 'Transaction Date', 'Amount', 'Product']`,
    commonMistakes: [
      'Not calling df.copy() first. When you write result["col"] = ... on the original df, you silently modify the caller\'s DataFrame. On a pipeline rerun, the input is already transformed, causing double-transformation and wrong output.',
      'Using df.dropna() without specifying subset=["customer_id"]. Without subset, rows with NaT in transaction_date would also be dropped — removing valid records that just had unparseable dates.',
      'Filtering negatives with df[df["amount"] != 0] instead of df[df["amount"] >= 0]. Zero-value transactions are valid (refunds at cost); only negative values are data entry errors.',
    ],
    interviewConnection:
      'The mutation bug — not calling df.copy() — is the first thing a senior engineer checks in a Pandas code review. Demonstrating awareness of it signals production-level thinking rather than script-level thinking.',
    solutionCode: `import pandas as pd


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result.columns = result.columns.str.lower().str.replace(' ', '_', regex=False)
    result['transaction_date'] = pd.to_datetime(
        result['transaction_date'], errors='coerce'
    )
    result = result.dropna(subset=['customer_id'])
    result = result[result['amount'] >= 0]
    return result
`,
    solutionAnnotations: [
      '"result = df.copy()": defensive copy on line 1 — the caller\'s DataFrame is guaranteed unchanged regardless of what happens inside this function.',
      '".str.lower().str.replace(...)": chained string accessors normalize all column names in one line — no loop needed.',
      '"errors=\'coerce\'": unparseable dates become NaT instead of raising ValueError — safe for production data with mixed-quality date strings.',
      '"dropna(subset=[\'customer_id\'])": drops only the rows where the key is missing, leaving NaT dates untouched.',
      '"result[result[\'amount\'] >= 0]": zero is kept (refund), negative is removed (data error). The intent is explicit.',
    ],
  },

  // ─── Exercise 4: Modular ETL Class ──────────────────────────────────────────
  {
    id: 'py-ex-04',
    number: 4,
    title: 'Modular ETL Class Design',
    difficulty: 'Intermediate',
    estimatedMinutes: 30,
    tags: ['OOP', 'ETL Design', 'Configuration Injection'],
    scenario:
      'You are refactoring a 200-line procedural ETL script into a reusable, testable class. The pipeline reads from a configurable source path, applies Silver-layer transformations, and writes to a configurable destination. It must be instantiable with different configurations for dev, staging, and prod without modifying the code.',
    objective:
      'Implement SalesETL with __init__, extract, transform, and run methods. run() returns a structured result dict.',
    starterCode: `import pandas as pd


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """Silver-layer transformation (solution from Exercise 3)."""
    result = df.copy()
    result.columns = result.columns.str.lower().str.replace(' ', '_', regex=False)
    result['transaction_date'] = pd.to_datetime(result['transaction_date'], errors='coerce')
    result = result.dropna(subset=['customer_id'])
    result = result[result['amount'] >= 0]
    return result


class SalesETL:
    """
    Configurable, testable ETL class for the sales pipeline.

    Config keys:
        source_path (str): Path to the source CSV.
        dest_path   (str): Destination path for the cleaned CSV.
        env         (str): 'dev', 'staging', or 'prod'.
    """

    def __init__(self, config: dict):
        # TODO: Store config as self.config — nothing else in __init__
        pass

    def extract(self) -> pd.DataFrame:
        """
        Read the source CSV.

        Returns:
            Raw DataFrame, or empty DataFrame if source is missing.
        """
        # TODO: pd.read_csv from self.config['source_path']
        # Return pd.DataFrame() on FileNotFoundError or missing config key
        pass

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply Silver-layer transformations.

        Pure function: takes a DataFrame, returns a DataFrame. No side effects.
        """
        # TODO: delegate to clean_transactions(df) — one line
        pass

    def run(self) -> dict:
        """
        Execute the full ETL: extract → transform → load (write to dest_path).

        Returns:
            dict with keys: rows_extracted (int), rows_loaded (int), status (str)
            Possible status: 'success', 'no_data', 'error'
        """
        # TODO: Chain extract → transform → write to dest_path
        # If raw.empty: return {'status': 'no_data', 'rows_extracted': 0, 'rows_loaded': 0}
        # Catch all exceptions: return {'status': 'error', 'rows_extracted': 0, 'rows_loaded': 0}
        pass


# ─── Test it ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    config = {
        'source_path': 'sales.csv',
        'dest_path':   '/tmp/sales_silver.csv',
        'env':         'dev',
    }

    etl = SalesETL(config)
    result = etl.run()
    print('Result:', result)

    # Test transform purity
    raw = pd.DataFrame({'Customer ID': [1], 'Transaction Date': ['2024-01-01'], 'Amount': [100]})
    before_cols = raw.columns.tolist()
    etl.transform(raw)
    print('Transform purity:', raw.columns.tolist() == before_cols)
`,
    hints: [
      'In __init__, write "self.config = config" — that is the entire method. No parsing, no file reading, no validation at construction time. In extract(), use self.config.get(\'source_path\') and catch FileNotFoundError to return pd.DataFrame().',
      'In run(), capture "rows_extracted = len(raw)" before calling transform. After transform and write, "rows_loaded = len(cleaned)" reflects how many rows passed the Silver rules. Wrap the entire run body in try/except Exception to return the error status without crashing.',
    ],
    expectedOutput: `Result: {'status': 'success', 'rows_extracted': 247, 'rows_loaded': 233}
Transform purity: True`,
    commonMistakes: [
      'Hardcoding source_path inside the class instead of reading from self.config. This makes the class untestable — you cannot inject a test path without modifying the code.',
      'Putting business logic in __init__. If __init__ reads a file, the class cannot be instantiated in a test without a real file present. Construction stores; execution runs.',
      'Making transform() a side-effectful method that modifies a class attribute instead of a pure function. Pure transform methods can be unit tested in isolation with any input.',
    ],
    interviewConnection:
      '"Walk me through how you\'d structure a production Python ETL pipeline" is the most common senior Python question in Azure DE interviews. This class — configuration injection, separated methods, structured result dict — is exactly the answer interviewers expect at the 5-year level.',
    solutionCode: `import pandas as pd


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result.columns = result.columns.str.lower().str.replace(' ', '_', regex=False)
    result['transaction_date'] = pd.to_datetime(result['transaction_date'], errors='coerce')
    result = result.dropna(subset=['customer_id'])
    result = result[result['amount'] >= 0]
    return result


class SalesETL:
    def __init__(self, config: dict):
        self.config = config

    def extract(self) -> pd.DataFrame:
        try:
            return pd.read_csv(self.config['source_path'])
        except (FileNotFoundError, KeyError):
            return pd.DataFrame()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return clean_transactions(df)

    def run(self) -> dict:
        try:
            raw = self.extract()
            if raw.empty:
                return {'status': 'no_data', 'rows_extracted': 0, 'rows_loaded': 0}

            rows_extracted = len(raw)
            cleaned = self.transform(raw)
            cleaned.to_csv(self.config['dest_path'], index=False)

            return {
                'status': 'success',
                'rows_extracted': rows_extracted,
                'rows_loaded': len(cleaned),
            }
        except Exception:
            return {'status': 'error', 'rows_extracted': 0, 'rows_loaded': 0}
`,
    solutionAnnotations: [
      '"self.config = config": the entire configuration contract in one line. No parsing, no validation in __init__.',
      'extract() catches both FileNotFoundError and KeyError (missing config key) — both return an empty DataFrame, letting run() detect no_data cleanly.',
      'transform() is one line delegating to clean_transactions(). The class composes existing functions rather than reimplementing logic.',
      '"rows_extracted" is captured before transform runs. "len(cleaned)" reflects how many rows the Silver rules kept — the difference shows the cleaning yield.',
      'The outer try/except in run() returns {\'status\': \'error\'} on any unexpected failure — the pipeline never crashes its orchestrator.',
    ],
  },
];

// ── Python Interview Mode — added to mockInterviewModes ──────────────────────
export const PYTHON_INTERVIEW_MODE = {
  id: 'python',
  title: 'Python Interview',
  summary: 'Practice the Python questions that appear in Azure DE technical screens: ETL architecture, code review, and performance at scale.',
  coaching: {
    lookFor: 'Applied knowledge, not vocabulary. Can they write code under pressure, explain design decisions, and spot production bugs in someone else\'s code?',
    structure: 'Lead with the design principle, give one concrete Python example, then mention the production implication — testability, debuggability, or performance.',
    mistakes: 'Describing patterns conceptually without naming specific Python constructs. Experienced interviewers follow up with "can you show me in code?" Vague answers fail that follow-up.',
    mention: 'Mention configuration injection, specific exception types, and Python logging when production readiness or observability is being evaluated.',
  },
  questions: [
    {
      question: 'Walk me through how you would structure a Python ETL pipeline for production. What would you build, and why?',
      interviewerExpectation: 'A class-based design with separated extract/transform/load methods, configuration injection, structured logging, and a CLI entry point. Not a procedural script with hardcoded paths.',
      strongAnswer: 'I would build an ETL class that accepts a configuration dictionary at construction time — source path, destination path, environment name. Extract, transform, and load are separate methods with single responsibilities. Transform is a pure function: it takes a DataFrame and returns a DataFrame, no side effects. run() chains them and returns a structured result dict with row counts and status. Every state transition is logged at the appropriate level using the Python logging module — INFO for stage transitions, ERROR with logger.exception() for failures so the stack trace is preserved. The script has a main() function with argparse for the CLI interface and exits with code 0 on success or 1 on failure so the orchestrator detects pipeline failures without parsing logs.',
      commonWeakAnswer: 'Write a script with functions for each step — extract(), transform(), load() — called in sequence at the bottom of the file.',
      coachNote: 'The distinguishing factor is configuration injection. A script with hardcoded paths cannot be tested without modifying the code. A class that accepts a config dict can be instantiated with a test config in a unit test. This is what senior interviewers mean when they ask "how do you make this testable?"',
    },
    {
      question: 'I am going to show you a Python function. Tell me everything you would flag in a code review.\n\ndef process_orders(orders):\n    result = []\n    for i, row in orders.iterrows():\n        orders["status"] = orders["status"].str.upper()\n        if row["amount"] > 0:\n            result.append(row)\n    return pd.DataFrame(result)',
      interviewerExpectation: 'At minimum: iterrows() performance and in-place mutation. A strong answer identifies the mutation-while-iterating correctness bug and at least one more issue with production consequence.',
      strongAnswer: 'Four flags. One: orders["status"] = ... modifies the caller\'s DataFrame inside the loop — silent data integrity bug. The caller does not know their data changed. Two: modifying orders while iterating over it with iterrows() produces undefined behavior — Pandas may skip or repeat rows depending on the index. Three: iterrows() is 100 to 1000 times slower than vectorized operations. On 500K rows this takes minutes; the vectorized version takes under a second. Four: if orders is empty, pd.DataFrame(result) returns an empty DataFrame with no column schema, which causes a KeyError on the next pipeline step that tries to access expected columns.',
      commonWeakAnswer: 'This code uses iterrows() which is slow. You should use vectorized Pandas operations instead.',
      coachNote: 'Only flagging iterrows() is the junior answer — it is the obvious surface-level catch. The mutation bug is what senior engineers find. Interviewers use code review questions specifically to see who spots silent correctness bugs versus who only catches performance issues.',
    },
    {
      question: 'Your Pandas transformation pipeline runs fine on your 10,000-row development sample. It fails with a MemoryError on the production file of 50 million rows. What are your options?',
      interviewerExpectation: 'Diagnose first, then present Pandas-level options before escalating to distributed frameworks. Jumping straight to Spark is the mid-level answer.',
      strongAnswer: 'First, diagnose: a MemoryError on 50M rows usually means Pandas is holding two or three copies of the DataFrame simultaneously — input, intermediate, and output. At 50M rows with 20 float64 columns, that is 8 gigabytes before any transformation overhead. Two Pandas-level options before reaching for Spark. One: dtype optimization. df.info(memory_usage="deep") often shows string columns stored as Python object dtype — converting low-cardinality columns to category dtype can reduce memory 4 to 8 times. Try this first. Two: chunked processing with pd.read_csv(chunksize=500000). Process in half-million-row chunks, transform each, write incrementally. This works for stateless-per-row transforms like filtering and casting, but not for operations that require the full dataset like groupby or deduplication. If those options are exhausted and the transform requires cross-row operations at this scale, I move to PySpark on Databricks.',
      commonWeakAnswer: 'Use Spark instead — Pandas does not scale to that size.',
      coachNote: 'The dtype optimization option is what separates senior from mid-level answers. It shows the engineer understands memory layout, not just tooling. And the caveat — chunked processing does not work for cross-row operations — shows production judgment rather than generic advice.',
    },
  ],
};
