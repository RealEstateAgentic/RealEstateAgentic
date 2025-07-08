# Contributing to RealEstateAgentic

We're excited to have you contribute! To ensure a smooth and effective collaboration, please follow these guidelines.

## Our Workflow

We use a simple branching and pull request workflow. This helps us keep the main codebase stable while we all work on new features and fixes.

### 1. Pick an Issue

Everything starts with an issue. We use GitHub Issues to track all of our work—from new features to small bugs.

*   **Find an issue:** Go to the [**Issues tab**](https://github.com/your-org/RealEstateAgentic/issues) in our repository to see what's available to work on.
*   **Assign yourself:** If you find an issue you want to work on, assign it to yourself. This lets the rest of the team know what you're focused on and prevents us from working on the same thing. If you want to work on something that doesn't have an issue, please create one first and discuss it with the team.

### 2. Create Your Branch

Once you have an issue, it's time to create a branch. All work should be done in a separate branch, not directly on `main`.

*   **Branch Naming:** We use the format `{initials}/{feature-name}` for our branches.
    *   `{initials}`: Your three-letter initials (e.g., `bpp` for Brooks Poltl).
    *   `{feature-name}`: A few words describing the work, separated by hyphens.
    *   **Example:** `bpp/add-login-form`

*   **How to create your branch:**

    1.  First, make sure your `main` branch is up-to-date with the latest changes from the repository:
        ```bash
        git checkout main
        git pull origin main
        ```
    2.  Now, create your new branch:
        ```bash
        git checkout -b bpp/add-login-form
        ```
        (Replace `bpp/add-login-form` with your branch name).

### 3. Make and Commit Your Changes

Now you're ready to code! As you work, save your changes by making commits.

*   **Commit Messages:** Write clear and concise commit messages. We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard to keep our commit history clean and readable.
    *   **Examples:** `feat: add user authentication endpoint`, `fix: correct typo in header`, `docs: update contribution guide`.
*   **How to commit:**
    ```bash
    # Add the files you've changed
    git add .

    # Commit them with a message
    git commit -m "feat: your descriptive message"
    ```

### 4. Open a Pull Request (PR)

When you're ready to share your work with the team, you'll open a Pull Request. This is how you propose merging your changes into the `main` branch.

1.  **Push your branch to GitHub:**
    ```bash
    git push origin your-branch-name
    ```
    (e.g., `git push origin bpp/add-login-form`)

2.  **Create the Pull Request:**
    *   Go to our repository on GitHub.
    *   You'll see a green button to "Compare & pull request" for your new branch. Click it.
    *   Give your PR a clear title and in the description, link to the issue it solves by typing `Closes #` followed by the issue number (e.g., `Closes #42`). This automatically links your PR to the issue.

### 5. Review and Merge

Once your PR is open, other team members will review your code.

*   **Code Review:** Be ready for feedback and questions. This is a key part of how we learn from each other and maintain code quality. If changes are requested, just make them in your branch and push them up. The PR will update automatically.
*   **Merging:** Once your PR is approved, it will be merged into the `main` branch. Congratulations, you've successfully contributed! 