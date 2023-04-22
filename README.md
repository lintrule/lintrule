# Lintrule

Lintrule is a linter in which you write English, instead of arcane regexes.

## Install

```
sh <(curl -s https://raw.githubusercontent.com/lintrule/lintrule/master/install.sh)
```

## Quick Start

To start, run `rules init` in the root of your project. This will create a `rules` folder.

```
rules init
```

Next, let's login to Lintrule.

```
rules login
```

Next, let's create a new rule. For example, let's create a rule that checks that there aren't
any obvious vulnerabilities.

```
rules new vulnerabilities
```

This will create a file called `vulernabilities.txt` in the `rules` folder. Open it up, and
let's put something like this in it:

```
Fail if there's obvious vulnerabilities in the code.
```

Now, we can run all the rules.

```
rules check
```
