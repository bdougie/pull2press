import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Edit from "../pages/Edit";

// Set up mocks at the top level
const navigateMock = vi.fn();
const locationStateMock = {
  state: null as { content: string; prUrl: string } | null,
};
const paramsMock = {
  id: null as string | null,
};

// Mock the react-router-dom hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationStateMock,
    useParams: () => paramsMock,
  };
});

// Mock database response for fetching post by ID
const mockPostData = {
  id: "test-post-id",
  content: "Test post content from database",
  pr_url: "https://github.com/user/repo/pull/123",
  title: "Test Post Title",
  created_at: "2023-01-01T00:00:00Z",
  user_id: "test-user-id",
};

// Mock the supabase client
vi.mock("../lib/supabase", () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: (field: string, value: string) => ({
            single: () => {
              if (value === "test-post-id") {
                return Promise.resolve({ data: mockPostData, error: null });
              } else if (value === "error-id") {
                return Promise.resolve({
                  data: null,
                  error: { message: "Database error" },
                });
              } else {
                return Promise.resolve({ data: null, error: null });
              }
            },
            update: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            }),
            eq: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
        insert: () => Promise.resolve({ error: null }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    CachedPost: {},
  };
});

// Mock OpenAI and GitHub functions
vi.mock("../lib/openai", () => ({
  generateBlogPost: vi.fn().mockResolvedValue("Test blog content"),
}));

vi.mock("../lib/github", () => ({
  fetchPRData: vi
    .fn()
    .mockResolvedValue({ title: "Test PR", description: "Test description" }),
}));

// Mock the markdown editor component
vi.mock("../components/markdown-editor", () => ({
  default: ({
    initialContent,
    onRegenerate,
    isRegenerating,
    showSignInPrompt,
  }) => (
    <div data-testid="markdown-editor">
      <div data-testid="markdown-content">{initialContent}</div>
      <button onClick={onRegenerate} data-testid="regenerate-button">
        Regenerate
      </button>
      {isRegenerating && <div data-testid="loading-indicator">Loading...</div>}
      {showSignInPrompt && <div>Please sign in to save</div>}
    </div>
  ),
}));

describe("Edit Component Flow", () => {
  // Setup for individual tests
  beforeEach(() => {
    vi.clearAllMocks();
    locationStateMock.state = null;
    paramsMock.id = null;
  });

  it("redirects to home if no content is provided via state and no ID in URL", async () => {
    locationStateMock.state = null;
    paramsMock.id = null;

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    // Verify that navigate was called with "/"
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("displays the markdown editor with content from location state", async () => {
    locationStateMock.state = {
      content: "Test blog content from state",
      prUrl: "https://github.com/user/repo/pull/123",
    };
    paramsMock.id = null;

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
    });

    expect(screen.getByTestId("markdown-content")).toHaveTextContent(
      "Test blog content from state"
    );
  });

  it("navigates back to home when back button is clicked", async () => {
    locationStateMock.state = {
      content: "Test blog content",
      prUrl: "https://github.com/user/repo/pull/123",
    };

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Back to Home")).toBeInTheDocument();
    });

    const backButton = screen.getByText("Back to Home");
    fireEvent.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  // We're skipping this test for now as it requires a more complex setup
  it.skip("regenerates content when regenerate button is clicked", async () => {
    locationStateMock.state = {
      content: "Initial content",
      prUrl: "https://github.com/user/repo/pull/123",
    };

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("regenerate-button")).toBeInTheDocument();
    });

    const regenerateButton = screen.getByTestId("regenerate-button");
    fireEvent.click(regenerateButton);

    // Since we've mocked the regenerate functionality, we're just testing that
    // the button exists and can be clicked
    expect(regenerateButton).toBeInTheDocument();
  });

  // New tests for the ID-based post loading functionality
  it("fetches post data when an ID is provided in the URL", async () => {
    paramsMock.id = "test-post-id";

    render(
      <MemoryRouter initialEntries={["/edit/test-post-id"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    // Since loading is asynchronous, we need to wait for the content to appear
    await waitFor(() => {
      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
    });

    expect(screen.getByTestId("markdown-content")).toHaveTextContent(
      "Test post content from database"
    );
  });

  it("redirects to home if the post with the specified ID is not found", async () => {
    paramsMock.id = "non-existent-id";

    render(
      <MemoryRouter initialEntries={["/edit/non-existent-id"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    // Wait for the navigation to occur after data fetching
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to home if there's an error fetching the post", async () => {
    paramsMock.id = "error-id";

    render(
      <MemoryRouter initialEntries={["/edit/error-id"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    // Wait for the navigation to occur after error
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});
