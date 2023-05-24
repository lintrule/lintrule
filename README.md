# Lintrule

[Lintrule](https://lintrule.com) is a new kind of linter and test framework.

## Install

```
curl -fsSL https://www.lintrule.com/install.sh | bash
```

## Usage

In your codebase, setup a `rules` folder with the init command.

```
rules init
```

Next, login to Lintrule.

```
rules login
```

This will create a file a `rules/no-bugs.md` with your first rule. It's just a markdown file that says "don't approve obvious bugs." Try running it with:

```
rules check
```

To save on costs, Lintrule runs on diffs. By default, it runs on the changes since the last commit, effectively `git diff HEAD^`. If you want it to run on other diffs, you can pass them in as arguments.

```
# Check against main and the a feature branch
rules check --diff main..my-feature-branch

# Run on the last 3 commits
rules check --diff HEAD~3
```

---

### In a GitHub Action

Create a new secret and add it as an environment variable (`LINTRULE_SECRET`) to your GitHub Action.

```

rules secrets create

```

Then add the following to a workflow file in `.github/workflows/rules.yml`.

```yaml
name: Rules Check

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  rules:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 2 # this part is important!

      - name: Install Lint Rules
        run: |
          curl -fsSL https://www.lintrule.com/install.sh | bash

      - name: Run Lint Rules Check
        run: |
          rules check --secret "${{ secrets.LINTRULE_SECRET }}"
```

---

### Configuring rules

You can ensure rules only run on certain files by adding them to the frontmatter, like this:

```
---
include: ["**/**.sql"]
---

We're running postgres 8 and have about 1m rows
in the "users" table, please make sure our
migrations don't cause problems.

```

---

## FAQ

### Does Lintrule run on diffs?

Yes. By default, Lintrule runs only on changes that come from `git diff HEAD^`.

If you're in a GitHub Action, Lintrule smartly uses the `GITHUB_SHA` and `GITHUB_REF` environment variables to determine the diff. For PRs, Lintrule uses the `GITHUB_BASE_REF` and `GITHUB_HEAD_REF`.

### Does it have false positives?

Yes. Just like a person, the more general the instructions, the more likely it will do something you don't want. To fix false positives, get specific.

On the other hand, Lintrule tends to not be _flaky_. If a rule produces a false positive, it tends to produce the same false positive. If you fix it, it tends to stay fixed for the same type of code.

### That's a lot of money, how do I make it cheaper?

- The estimator shows you how much it costs if you run Lintrule on _every commit_. Try running Lintrule only on _pull requests_.
- Instead of using lots of rules, try fitting more details into one rule. But be warned, the more competing details you have in a rule, the more likely it is that you'll get false positives.
- Use `include` to silo your rules to certain files. That makes it easier to add more rules without increasing your cost.

As LLMs get cheaper to run, we expect the prices to go down significantly.

### Is it slow?

Not really. Lintrules runs rules in parallel, so regardless of how many rules or files you have, it will complete in a few seconds.

