# CI

GitHub Actions runs dependency installation, TypeScript validation, ESLint, unit tests, and a production build on pushes and pull requests targeting `main`.

A dependency lockfile should be committed once dependencies are installed in a network-enabled development environment; CI currently uses `npm install` because the repository was initialized without a lockfile.
