# Frontend Testing Guide

## 1. Objective
Ensure React UI components and critical user flows work as expected using automated tests.

## 2. Tools
- **Vitest**: For unit and component testing. Fast, natively integrated with Vite.
- **React Testing Library**: For rendering components and interacting with the DOM (clicking buttons, checking text).

## 3. Plan

### Phase 1: Setup
1.  Install dependencies: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`
2.  Configure `vite.config.js` to enable test environment.
3.  Add `setupTests.js` to handle global imports (like jest-dom matchers).

### Phase 2: Component Tests
Create tests alongside components or in a `__tests__` directory.

**Example `src/components/__tests__/RecipeCard.test.jsx`**:
```jsx
import { render, screen } from '@testing-library/react';
import RecipeCard from '../RecipeCard';

test('renders recipe title', () => {
    const recipe = { title: "Pancakes", calories: 300 };
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getByText(/Pancakes/i)).toBeInTheDocument();
});
```

### Phase 3: Running Tests
- **Run all:** `npm run test`
- **Watch mode:** `npm run test -- --watch`

## 4. CI/CD
These tests should run in the build pipeline. If they fail, the build fails.
