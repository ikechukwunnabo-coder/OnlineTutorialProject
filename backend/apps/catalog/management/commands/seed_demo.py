from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Category, Chapter, CodeExample, Tag, Tutorial
from apps.common.choices import PublicationStatus

CATEGORIES = [
    {
        "name": "Web Development",
        "slug": "web-development",
        "description": "Build pages and interfaces for the web.",
        "icon": "globe",
        "display_order": 1,
    },
    {
        "name": "Programming",
        "slug": "programming",
        "description": "Learn programming fundamentals with practical examples.",
        "icon": "code",
        "display_order": 2,
    },
    {
        "name": "Databases",
        "slug": "databases",
        "description": "Store, query, and understand data.",
        "icon": "database",
        "display_order": 3,
    },
    {
        "name": "Developer Tools",
        "slug": "developer-tools",
        "description": "Use the tools professionals rely on.",
        "icon": "tools",
        "display_order": 4,
    },
]


def chapter(title, slug, summary, body, language, code, output=""):
    return {
        "title": title,
        "slug": slug,
        "summary": summary,
        "content": body,
        "code": {
            "language": language,
            "title": f"{title} example",
            "source": code,
            "expected_output": output,
        },
    }


TUTORIALS = [
    {
        "title": "HTML and CSS Basics",
        "slug": "html-css-basics",
        "category": "web-development",
        "summary": "Build your first web page and style it with CSS.",
        "difficulty": "beginner",
        "tags": ["HTML", "CSS"],
        "chapters": [
            chapter(
                "What HTML Does",
                "what-html-does",
                "Understand the role of HTML in a web page.",
                "HTML describes the structure of a page. It tells the browser which "
                "parts are headings, paragraphs, links, and images. Browsers read HTML "
                "from top to bottom and build a document tree.",
                "html",
                "<h1>Hello, world</h1>\n<p>This is my first paragraph.</p>",
                "A large heading followed by a paragraph.",
            ),
            chapter(
                "Your First HTML Page",
                "your-first-html-page",
                "Create a complete HTML document.",
                "A complete page has a doctype, a head, and a body. The head contains "
                "metadata such as the page title. The body contains everything visitors "
                "see. Save the file with an .html extension and open it in a browser.",
                "html",
                '<!doctype html>\n<html lang="en">\n  <head>\n    <title>My page</title>\n  </head>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>',
                "A page with the title My page and a Hello heading.",
            ),
            chapter(
                "Styling with CSS",
                "styling-with-css",
                "Change colours, spacing, and typography.",
                "CSS controls how HTML looks. A rule selects an element and applies "
                "declarations such as colour and font size. Keeping CSS in a separate "
                "file makes a site easier to maintain.",
                "css",
                "body {\n  font-family: system-ui, sans-serif;\n  color: #1f2937;\n}\n\nh1 {\n  color: #0f766e;\n}",
                "Dark grey body text and a teal heading.",
            ),
            chapter(
                "Layout with Flexbox",
                "layout-with-flexbox",
                "Arrange elements in rows and columns.",
                "Flexbox is a layout mode for arranging items along one axis. Set display "
                "flex on a container, then use gap, justify-content, and align-items to "
                "control spacing and alignment. It adapts well to small screens.",
                "css",
                ".row {\n  display: flex;\n  gap: 1rem;\n  align-items: center;\n}",
                "Child elements arranged in a row with space between them.",
            ),
        ],
    },
    {
        "title": "JavaScript Basics",
        "slug": "javascript-basics",
        "category": "programming",
        "summary": "Learn variables, decisions, loops, and functions in JavaScript.",
        "difficulty": "beginner",
        "tags": ["JavaScript", "Programming"],
        "chapters": [
            chapter(
                "Variables and Values",
                "variables-and-values",
                "Store and label values in a program.",
                "A variable is a name for a value. Use const when the value should not be "
                "reassigned and let when it will change. JavaScript has strings, numbers, "
                "booleans, objects, and more.",
                "javascript",
                'const name = "Ada";\nlet score = 10;\nscore = score + 5;\nconsole.log(name, score);',
                "Ada 15",
            ),
            chapter(
                "Making Decisions",
                "making-decisions",
                "Run different code based on a condition.",
                "An if statement runs a block only when its condition is true. Use else to "
                "handle the opposite case. Comparisons such as === produce a boolean value.",
                "javascript",
                'const score = 72;\nif (score >= 70) {\n  console.log("Pass");\n} else {\n  console.log("Try again");\n}',
                "Pass",
            ),
            chapter(
                "Loops and Lists",
                "loops-and-lists",
                "Repeat work with arrays and loops.",
                "An array holds an ordered list of values. A for...of loop visits each item "
                "once. This pattern is useful for totals, rendering lists, and processing "
                "collections of data.",
                "javascript",
                "const scores = [70, 85, 92];\nfor (const score of scores) {\n  console.log(score);\n}",
                "70\n85\n92",
            ),
            chapter(
                "Functions",
                "functions",
                "Package reusable logic with inputs and outputs.",
                "A function takes parameters, performs work, and returns a value. Call it by "
                "name and pass arguments. Small functions with clear names make programs "
                "easier to test and change.",
                "javascript",
                "function double(value) {\n  return value * 2;\n}\nconsole.log(double(21));",
                "42",
            ),
        ],
    },
    {
        "title": "Python Basics",
        "slug": "python-basics",
        "category": "programming",
        "summary": "Start programming with Python syntax and core ideas.",
        "difficulty": "beginner",
        "tags": ["Python", "Programming"],
        "chapters": [
            chapter(
                "Running Python",
                "running-python",
                "Run a Python file and print output.",
                "Python reads a file from top to bottom. The print function writes text to "
                "the terminal. Install Python 3, save a file ending in .py, and run it with "
                "the python command.",
                "python",
                'print("Hello from Python")',
                "Hello from Python",
            ),
            chapter(
                "Variables and Types",
                "variables-and-types",
                "Store text, numbers, and true/false values.",
                "Python creates a variable when you assign a value. Common types are str, "
                "int, float, and bool. Use type() to inspect a value when you are unsure.",
                "python",
                'name = "Ada"\nscore = 10\npassed = True\nprint(name, score, passed)',
                "Ada 10 True",
            ),
            chapter(
                "Conditionals",
                "conditionals",
                "Choose a branch with if, elif, and else.",
                "Indentation defines blocks in Python. Conditions are checked in order, and "
                "the first true branch runs. Keep conditions simple and name values clearly.",
                "python",
                'score = 72\nif score >= 70:\n    print("Pass")\nelse:\n    print("Try again")',
                "Pass",
            ),
            chapter(
                "Loops and Functions",
                "loops-and-functions",
                "Repeat work and reuse logic.",
                "A for loop visits each item in a sequence. A function groups statements "
                "behind a name and can return a result. Combine both to process a list of "
                "values without repeating code.",
                "python",
                "def total(values):\n    result = 0\n    for value in values:\n        result += value\n    return result\n\nprint(total([1, 2, 3]))",
                "6",
            ),
        ],
    },
    {
        "title": "SQL Basics",
        "slug": "sql-basics",
        "category": "databases",
        "summary": "Read and filter data with structured query language.",
        "difficulty": "beginner",
        "tags": ["SQL", "Databases"],
        "chapters": [
            chapter(
                "What a Database Is",
                "what-a-database-is",
                "Understand tables, rows, and columns.",
                "A relational database stores data in tables. Each row is a record and each "
                "column is a field with a type. SQL is the language used to create and query "
                "those tables.",
                "sql",
                "CREATE TABLE students (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);",
                "A students table with an id and a name column.",
            ),
            chapter(
                "Selecting Data",
                "selecting-data",
                "Read columns from a table.",
                "SELECT chooses columns and FROM names the table. Use * to return every "
                "column. Add ORDER BY to control the order of the results.",
                "sql",
                "SELECT name, score\nFROM students\nORDER BY score DESC;",
                "Student names and scores, highest score first.",
            ),
            chapter(
                "Filtering Rows",
                "filtering-rows",
                "Keep only rows that match a condition.",
                "WHERE filters rows before they are returned. Combine conditions with AND "
                "and OR. Use parameters in application code instead of joining user input "
                "into the query string.",
                "sql",
                "SELECT name\nFROM students\nWHERE score >= 70;",
                "Names of students who scored at least 70.",
            ),
            chapter(
                "Joining Tables",
                "joining-tables",
                "Combine related data from two tables.",
                "A join connects rows that share a key. INNER JOIN keeps matches, while LEFT "
                "JOIN also keeps unmatched rows from the left table. Choose the join that "
                "matches the question you are asking.",
                "sql",
                "SELECT students.name, courses.title\nFROM students\nJOIN enrolments ON enrolments.student_id = students.id\nJOIN courses ON courses.id = enrolments.course_id;",
                "Each student name with the title of a course they take.",
            ),
        ],
    },
    {
        "title": "Git Basics",
        "slug": "git-basics",
        "category": "developer-tools",
        "summary": "Track changes and collaborate with Git.",
        "difficulty": "beginner",
        "tags": ["Git", "Version Control"],
        "chapters": [
            chapter(
                "Why Version Control",
                "why-version-control",
                "Understand the problem Git solves.",
                "Version control records changes to files over time. You can review history, "
                "undo mistakes, and work on separate ideas. Git stores snapshots called "
                "commits in a repository.",
                "bash",
                "git --version\ngit init",
                "The Git version and a new empty repository.",
            ),
            chapter(
                "Your First Commit",
                "your-first-commit",
                "Stage files and record a snapshot.",
                "git status shows what changed. git add stages changes, and git commit "
                "records them with a message. Write short messages that explain why the "
                "change was made.",
                "bash",
                'git status\ngit add README.md\ngit commit -m "Add project README"',
                "A new commit containing the README.",
            ),
            chapter(
                "Branches",
                "branches",
                "Work on a change without disturbing main.",
                "A branch is a movable pointer to a commit. Create a branch for each change, "
                "then merge it back when it is ready. This keeps the main branch stable.",
                "bash",
                "git switch -c add-contact-page\ngit switch main\ngit merge add-contact-page",
                "A merged branch with the new page.",
            ),
            chapter(
                "Working with Remotes",
                "working-with-remotes",
                "Share commits through a remote repository.",
                "A remote is a copy of the repository stored elsewhere. git push uploads "
                "commits and git pull downloads them. Fetch first when you need to inspect "
                "changes before merging.",
                "bash",
                "git remote add origin https://example.com/repo.git\ngit push -u origin main",
                "The local main branch tracking the remote.",
            ),
        ],
    },
]


class Command(BaseCommand):
    help = "Create idempotent demo categories, tutorials, chapters, and code examples."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--author-email",
            help="Email of the staff user who authors the demo tutorials.",
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        author = self._resolve_author(options.get("author_email"))
        now = timezone.now()

        for data in CATEGORIES:
            Category.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": f"Demo: {data['name']}",
                    "description": data["description"],
                    "icon": data["icon"],
                    "display_order": data["display_order"],
                    "status": PublicationStatus.PUBLISHED,
                    "is_demo": True,
                },
            )

        tag_cache: dict[str, Tag] = {}
        for tutorial_data in TUTORIALS:
            category = Category.objects.get(slug=tutorial_data["category"])
            tutorial, _ = Tutorial.objects.update_or_create(
                slug=tutorial_data["slug"],
                defaults={
                    "category": category,
                    "author": author,
                    "title": f"Demo: {tutorial_data['title']}",
                    "summary": tutorial_data["summary"],
                    "difficulty": tutorial_data["difficulty"],
                    "status": PublicationStatus.DRAFT,
                    "published_at": None,
                    "is_demo": True,
                },
            )

            for tag_name in tutorial_data["tags"]:
                slug = tag_name.lower().replace(" ", "-")
                tag_cache.setdefault(
                    slug,
                    Tag.objects.get_or_create(slug=slug, defaults={"name": tag_name})[0],
                )
            tutorial.tags.set(
                [
                    tag_cache[tag_name.lower().replace(" ", "-")]
                    for tag_name in tutorial_data["tags"]
                ]
            )

            chapter_slugs = []
            for order, chapter_data in enumerate(tutorial_data["chapters"], start=1):
                chapter_slugs.append(chapter_data["slug"])
                chapter_obj, _ = Chapter.objects.update_or_create(
                    tutorial=tutorial,
                    slug=chapter_data["slug"],
                    defaults={
                        "title": f"Demo: {chapter_data['title']}",
                        "summary": chapter_data["summary"],
                        "content": chapter_data["content"],
                        "order": order,
                        "status": PublicationStatus.PUBLISHED,
                        "published_at": now,
                        "is_demo": True,
                    },
                )
                code = chapter_data["code"]
                CodeExample.objects.update_or_create(
                    chapter=chapter_obj,
                    order=1,
                    defaults={
                        "language": code["language"],
                        "title": code["title"],
                        "source": code["source"],
                        "expected_output": code["expected_output"],
                    },
                )

            tutorial.chapters.filter(is_demo=True).exclude(slug__in=chapter_slugs).delete()
            tutorial.status = PublicationStatus.PUBLISHED
            tutorial.published_at = tutorial.published_at or now
            tutorial.save()

        self.stdout.write(
            self.style.SUCCESS(
                "Demo content ready: "
                f"{Category.objects.filter(is_demo=True).count()} categories, "
                f"{Tutorial.objects.filter(is_demo=True).count()} tutorials, "
                f"{Chapter.objects.filter(is_demo=True).count()} chapters."
            )
        )

    def _resolve_author(self, email: str | None) -> User:
        if email:
            author = User.objects.filter(email__iexact=email).first()
            if author is None:
                raise CommandError(f"No user found with email {email!r}.")
        else:
            author = User.objects.filter(is_superuser=True).order_by("id").first()
            if author is None:
                raise CommandError(
                    "No author found. Pass --author-email or create a superuser first."
                )
        if not author.is_staff:
            raise CommandError("The demo author must be a staff user.")
        return author
