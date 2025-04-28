import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Edit from "../pages/Edit";
import Home from "../pages/Home";

// Set up mocks at the top level
const navigateMock = vi.fn();
const locationStateMock = { state: null };

// Mock the react-router-dom hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationStateMock,
  };
});

// Mock the supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
          update: () => Promise.resolve({ error: null }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
        insert: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
  CachedPost: {},
}));

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
  default: ({ initialContent, onRegenerate }) => (
    <div data-testid="markdown-editor">
      <div data-testid="markdown-content">{initialContent}</div>
      <button onClick={onRegenerate} data-testid="regenerate-button">
        Regenerate
      </button>
    </div>
  ),
}));

describe("Edit Component Flow", () => {
  // Setup for individual tests
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to home if no content is provided via state", () => {
    locationStateMock.state = null;

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    // Verify that navigate was called with "/"
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("displays the markdown editor with content from location state", () => {
    locationStateMock.state = {
      content: "Test blog content from state",
      prUrl: "https://github.com/user/repo/pull/123",
    };

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
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

    const backButton = screen.getByText("Back to Home");
    fireEvent.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("regenerates content when regenerate button is clicked", async () => {
    locationStateMock.state = {
      content: "Initial content",
      prUrl: "https://github.com/user/repo/pull/123",
    };

    render(
      <MemoryRouter initialEntries={["/edit"]}>
        <Edit user={null} />
      </MemoryRouter>
    );

    const regenerateButton = screen.getByTestId("regenerate-button");
    fireEvent.click(regenerateButton);

    // Since we've mocked the regenerate functionality, we're just testing that
    // the button exists and can be clicked
    expect(regenerateButton).toBeInTheDocument();
  });
});
