# Lintrule

Lintrule is a linter in which you write English, instead of arcane regexes.

## Install

```
sh <(curl -s https://raw.githubusercontent.com/lintrule/lintrule/master/install.sh)
```

## Quick Start

To start, run `rules init` in the root of your project. This will create a `rules` folder.

```bash
$ rules init
```

Next, let's login to Lintrule.

```bash
$ rules login
```

Next, let's create a new rule. For example, let's create a rule that checks that there aren't
any obvious vulnerabilities.

```bash
$ rules add no-xss
```

This will create a file called `no-xss.txt` in the `rules` folder. Open it up, and
let's put something like this in it:

```markdown
Fail if there's obvious xss vulnerabilities in the code.
```

Now, we can run all the rules.

```bash
$ rules check
```
