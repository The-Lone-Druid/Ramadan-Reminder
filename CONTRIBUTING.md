# Contributing to Ramadan Reminder

First off, thank you for considering contributing to Ramadan Reminder! It's people like you that make Ramadan Reminder such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

1. **Use a clear and descriptive title**
2. **Describe the exact steps to reproduce the problem**
3. **Provide specific examples to demonstrate the steps**
4. **Describe the behavior you observed after following the steps**
5. **Explain which behavior you expected to see instead and why**
6. **Include screenshots and animated GIFs if possible**
7. **Include your environment details:**
   - Device model and OS version
   - App version
   - Relevant settings

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

1. **Use a clear and descriptive title**
2. **Provide a step-by-step description of the suggested enhancement**
3. **Provide specific examples to demonstrate the steps**
4. **Describe the current behavior and explain the behavior you expected to see**
5. **Explain why this enhancement would be useful**
6. **List some other applications where this enhancement exists**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setting Up Development Environment

1. Fork and clone the repository

    ```bash
    git clone https://github.com/your-username/ramadan-reminder.git
    cd ramadan-reminder
    ```

2. Install dependencies

    ```bash
    npm install
    ```

3. Create a branch

    ```bash
    git checkout -b feature/your-feature-name
    ```

### Coding Standards

#### TypeScript Style Guide

- Use TypeScript for all new code
- Follow the existing code style
- Use interfaces for object types
- Use type annotations for function parameters and return types
- Use async/await for asynchronous operations

```typescript
// Good
interface UserSettings {
  notifications: boolean;
  language: string;
}

async function getUserSettings(): Promise<UserSettings> {
  try {
    return await Storage.get('settings');
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

// Bad
function getUserSettings() {
  return Storage.get('settings').then(settings => settings);
}
```

#### Component Structure

```typescript
// ComponentName.tsx
import React from 'react';
import { IonContent } from '@ionic/react';
import './ComponentName.css';

interface ComponentNameProps {
  prop1: string;
  prop2: number;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // Component logic here
  return (
    <IonContent>
      {/* Component JSX */}
    </IonContent>
  );
};
```

### Testing Guidelines

1. **Unit Tests**
   - Write tests for all new features
   - Use Jest and React Testing Library
   - Follow the AAA pattern (Arrange, Act, Assert)

    ```typescript
    describe('ComponentName', () => {
    it('should render correctly', () => {
        // Arrange
        const props = { prop1: 'test', prop2: 42 };

        // Act
        const { getByText } = render(<ComponentName {...props} />);

        // Assert
        expect(getByText('test')).toBeInTheDocument();
    });
    });
    ```

2. **E2E Tests**
   - Write E2E tests for critical user paths
   - Use Cypress for E2E testing
   - Test on multiple device sizes

### Git Commit Guidelines

- Use semantic commit messages:
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation changes
  - `style:` formatting, missing semicolons, etc.
  - `refactor:` code change that neither fixes a bug nor adds a feature
  - `test:` adding missing tests
  - `chore:` updating build tasks, package manager configs, etc.

```bash
# Example
git commit -m "feat: add voice reminder scheduling"
```

### Branch Naming Convention

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Documentation: `docs/what-changed`
- Release branches: `release/version-number`

### Code Review Process

1. **Before Review**
   - Run all tests
   - Update documentation
   - Self-review your changes
   - Add comments for complex logic

2. **During Review**
   - Be respectful and constructive
   - Explain your reasoning
   - Link to relevant issues/documentation

3. **After Review**
   - Address all comments
   - Request re-review if needed
   - Update tests if required

### Release Process

1. Update version numbers

    ```bash
    npm run release:patch|minor|major
    ```

2. Update CHANGELOG.md
3. Create release branch
4. Build and test release
5. Create GitHub release
6. Deploy to app stores

## Project Structure
