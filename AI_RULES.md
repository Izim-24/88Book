# AI Development Rules & Tech Stack

## Tech Stack
- **Frontend**: React 18 with TypeScript and Vite for fast development.
- **Styling**: Tailwind CSS 4 for utility-first styling and responsive design.
- **UI Components**: Shadcn UI (built on Radix UI primitives) for accessible, unstyled components.
- **Icons**: Lucide React for a consistent and lightweight icon set.
- **State Management**: React Context API for global state (Auth, Cart).
- **Backend**: Node.js with Express.js for the RESTful API.
- **Database**: SQL Server for reliable relational data storage.
- **Authentication**: JWT (JSON Web Tokens) for secure, stateless sessions.
- **API Client**: Custom fetch wrapper in `src/api/client.js` for consistent error handling.

## Development Rules
- **UI Consistency**: Always use Shadcn UI components located in `src/app/components/ui/`. Do not reinvent basic components.
- **Styling**: Use Tailwind CSS classes exclusively. Avoid inline styles or external CSS files unless absolutely necessary.
- **Icons**: Use `lucide-react` for all icons.
- **API Calls**: All backend interactions must go through the `apiClient` or specific API objects in `src/api/client.js`.
- **State**: Use `useAuth` and `useCart` hooks for accessing global application state.
- **Component Structure**: Keep components small (under 100 lines). Extract sub-components into the `components/` directory.
- **Navigation**: Manage routing via the `currentPage` state in `App.tsx`.
- **Responsive Design**: Ensure all new features are mobile-friendly using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).
- **Error Handling**: Use the built-in error handling in the API client and display user-friendly messages via alerts or toasts.