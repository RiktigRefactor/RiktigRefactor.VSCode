---
name: pulling
description: Use whenever running `git pull` or updating the local branch from the remote, especially when it fails with "Cannot rebase onto multiple branches".
---

# Pulling

Another process on this machine sometimes pulls the same repo at the same time.
Its fetch writes extra entries into `FETCH_HEAD`, so `git pull` (with `pull.rebase=true`) fails with `fatal: Cannot rebase onto multiple branches.`

This is not a configuration problem, so don't investigate tracking branches or refspecs.

When it happens:

1. Run `git fetch`.
1. Run `git rebase origin/main` (or the current branch's upstream), which ignores `FETCH_HEAD`.
