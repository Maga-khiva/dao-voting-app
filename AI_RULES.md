# AI Development Rules & Tech Stack

## 🛠 Tech Stack
- **Smart Contracts**: Solidity (0.8.20) using the **Hardhat** framework for compilation, testing, and deployment.
- **Frontend Framework**: **React 18** powered by **Vite** for a fast development experience and optimized builds.
- **Blockchain Interaction**: **ethers.js (v6)** for all provider, signer, and contract interactions.
- **Styling**: **Tailwind CSS** for utility-first, responsive design and rapid UI development.
- **UI Components**: **shadcn/ui** (Radix UI based) for accessible, high-quality pre-built components.
- **Icons**: **Lucide React** for a consistent and modern iconography set.
- **State Management**: **React Context API** for global application state (Web3 connection, theme, etc.).
- **Environment**: **Node.js** environment with support for both TypeScript (backend/contracts) and JavaScript/JSX (frontend).

## 📏 Development Rules

### 1. Blockchain & Smart Contracts
- Use **ethers.js v6** syntax exclusively (e.g., `ethers.formatEther`, `ethers.Contract`).
- All contract read/write operations should be abstracted into hooks or services (see `src/hooks/useWeb3.js`).
- Always handle transaction states (loading, success, error) using the project's helper functions.

### 2. UI & Styling
- Use **Tailwind CSS** classes for all layout and spacing. Avoid custom CSS files unless absolutely necessary.
- Prefer **shadcn/ui** components for complex elements like Modals, Dialogs, and Form inputs.
- Ensure all new components are **Responsive** and support **Dark Mode** using Tailwind's `dark:` variant.
- Use **Lucide React** for all UI icons to maintain visual consistency.

### 3. Component Architecture
- Create a **new file** for every new component in `src/components/`.
- Keep components focused and under 100 lines of code where possible.
- Use **Functional Components** with hooks; avoid Class components.

### 4. Error Handling & Feedback
- Use the `parseErrorMessage` utility in `src/utils/helpers.js` to display user-friendly blockchain errors.
- Provide immediate visual feedback for user actions using **Toasts** or status indicators.

### 5. Routing & Navigation
- Follow the existing navigation pattern in `App.jsx`. If the project scales, transition to **React Router** as per standard guidelines.