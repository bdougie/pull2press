import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../pages/Home";

// Mock the navigate function
const mockNavigate = vi.fn();

// Mock functions for API calls
const mockGenerateBlogPost = vi.fn().mockResolvedValue("Test blog content");
const mockFetchPRData = vi.fn().mockResolvedValue({
  title: "Test PR",
  description: "Test description",
});

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock OpenAI and GitHub functions
vi.mock("../lib/openai", () => ({
  generateBlogPost: () => mockGenerateBlogPost(),
}));

vi.mock("../lib/github", () => ({
  fetchPRData: (url: string) => mockFetchPRData(url),
}));

// Mock the supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null }),
          }),
          single: () => Promise.resolve({ data: null }),
        }),
        insert: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

describe("Home Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockFetchPRData.mockResolvedValue({
      title: "Test PR",
      description: "Test description",
    });
    mockGenerateBlogPost.mockResolvedValue("Test blog content");
  });

  it("renders the PR form correctly", () => {
    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Transform Your Pull Request into a Blog Post")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pull Request URL")).toBeInTheDocument();
    expect(screen.getByText("Generate Blog Post")).toBeInTheDocument();
  });

  it("submits the form and navigates to edit page with new content", async () => {
    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Pull Request URL");
    const submitButton = screen.getByText("Generate Blog Post");

    fireEvent.change(input, {
      target: { value: "https://github.com/user/repo/pull/123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/edit", {
        state: {
          content: "Test blog content",
          prUrl: "https://github.com/user/repo/pull/123",
        },
      });
    });
  });

  it.skip("checks cached content for logged in users", async () => {
    // Mock user and cached content
    const mockUser = { id: "user-123" };

    // Override the Supabase mock for this test
    vi.mock("../lib/supabase", () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      content: "Cached blog content",
                      pr_url: "https://github.com/user/repo/pull/123",
                    },
                  }),
              }),
              single: () =>
                Promise.resolve({
                  data: {
                    content: "Cached blog content",
                    pr_url: "https://github.com/user/repo/pull/123",
                  },
                }),
            }),
          }),
        }),
      },
    }));

    render(
      <MemoryRouter>
        <Home user={mockUser} />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Pull Request URL");
    const submitButton = screen.getByText("Generate Blog Post");

    fireEvent.change(input, {
      target: { value: "https://github.com/user/repo/pull/123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/edit", {
        state: {
          content: "Cached blog content",
          prUrl: "https://github.com/user/repo/pull/123",
        },
      });
    });
  });

  it("handles errors during form submission", async () => {
    // Mock a failure
    mockFetchPRData.mockRejectedValue(new Error("Failed to fetch PR data"));

    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Pull Request URL");
    const submitButton = screen.getByText("Generate Blog Post");

    fireEvent.change(input, {
      target: { value: "https://github.com/user/repo/pull/123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch PR data")).toBeInTheDocument();
    });
  });

  it("displays a sign in message for non-authenticated users", () => {
    render(
      <MemoryRouter>
        <Home user={null} />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        "Sign in to save your generated posts and access them later"
      )
    ).toBeInTheDocument();
  });

  it("does not display sign in message for authenticated users", () => {
    render(
      <MemoryRouter>
        <Home user={{ id: "user-123" }} />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(
        "Sign in to save your generated posts and access them later"
      )
    ).not.toBeInTheDocument();
  });
});
