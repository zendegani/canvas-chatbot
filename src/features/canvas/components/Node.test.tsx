import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Node } from "./Node";
import type { ChatNode, OpenRouterModel } from "../types";

// Mock heavy rendering deps — we're testing behavior, not markdown rendering
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock("remark-gfm", () => ({ default: () => {} }));
vi.mock("remark-math", () => ({ default: () => {} }));
vi.mock("rehype-katex", () => ({ default: () => {} }));
vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  vscDarkPlus: {},
}));
vi.mock("react-syntax-highlighter", () => ({
  PrismLight: Object.assign(
    ({ children }: { children: string }) => <pre>{children}</pre>,
    { registerLanguage: vi.fn() }
  ),
}));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/tsx", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/typescript", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/javascript", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/python", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/json", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/bash", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/markdown", () => ({ default: {} }));
vi.mock("react-syntax-highlighter/dist/esm/languages/prism/css", () => ({ default: {} }));

// Mock ModelSelector to simplify
vi.mock("../../settings/components/ModelSelector", () => ({
  ModelSelector: ({ selectedModel, onSelect }: any) => (
    <button data-testid="model-selector" onClick={() => onSelect("new-model")}>
      {selectedModel}
    </button>
  ),
}));

const mockModels: OpenRouterModel[] = [
  { id: "google/gemini-pro", name: "Gemini Pro", context_length: 32000, pricing: { prompt: "0", completion: "0" } },
  { id: "openai/gpt-4", name: "GPT-4", context_length: 8192, pricing: { prompt: "0.03", completion: "0.06" } },
];

const baseNode: ChatNode = {
  id: "node-1",
  parentId: null,
  x: 100,
  y: 100,
  model: "google/gemini-pro",
  messages: [],
};

describe("Node", () => {
  const defaultProps = {
    node: baseNode,
    models: mockModels,
    onDelete: vi.fn(),
    onBranch: vi.fn(),
    onSendMessage: vi.fn(),
    onCompareMessage: vi.fn(),
    onUpdateModel: vi.fn(),
    onDragStart: vi.fn(),
    isMobile: false,
    hasChildren: false,
    onResize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no messages", () => {
    render(<Node {...defaultProps} />);

    expect(screen.getByText("Start a conversation...")).toBeInTheDocument();
  });

  it("renders 'Continue the conversation...' for branch nodes", () => {
    render(
      <Node
        {...defaultProps}
        node={{ ...baseNode, startIndex: 2, messages: [] }}
      />
    );

    expect(screen.getByText("Continue the conversation...")).toBeInTheDocument();
  });

  it("renders user messages", () => {
    const node: ChatNode = {
      ...baseNode,
      messages: [{ role: "user", content: "Hello world" }],
    };
    render(<Node {...defaultProps} node={node} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders assistant messages", () => {
    const node: ChatNode = {
      ...baseNode,
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
    };
    render(<Node {...defaultProps} node={node} />);

    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows loading spinner when isThinking", () => {
    const node: ChatNode = { ...baseNode, isThinking: true };
    render(<Node {...defaultProps} node={node} />);

    // The Loader2 icon from lucide is rendered with animate-spin
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("submits message on form submit", async () => {
    const user = userEvent.setup();
    render(<Node {...defaultProps} />);

    const input = screen.getByPlaceholderText("Ask anything...");
    await user.type(input, "Hello AI");
    await user.click(screen.getByRole("button", { name: "" })); // Send button with icon

    // Find the submit button (it has Send icon)
    const form = input.closest("form")!;
    // Actually, let's submit via Enter key
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("node-1", "Hello AI");
  });

  it("submits via Enter key", async () => {
    const user = userEvent.setup();
    render(<Node {...defaultProps} />);

    const input = screen.getByPlaceholderText("Ask anything...");
    await user.type(input, "Hello AI{enter}");

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("node-1", "Hello AI");
  });

  it("does not submit empty input", async () => {
    const user = userEvent.setup();
    render(<Node {...defaultProps} />);

    const input = screen.getByPlaceholderText("Ask anything...");
    await user.type(input, "{enter}");

    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });

  it("disables input when isThinking", () => {
    const node: ChatNode = { ...baseNode, isThinking: true };
    render(<Node {...defaultProps} node={node} />);

    expect(screen.getByPlaceholderText("Ask anything...")).toBeDisabled();
  });

  it("shows delete button when node has no children", () => {
    render(<Node {...defaultProps} hasChildren={false} />);

    expect(screen.getByTitle("Delete this node")).toBeInTheDocument();
  });

  it("hides delete button when node has children", () => {
    render(<Node {...defaultProps} hasChildren={true} />);

    expect(screen.queryByTitle("Delete this node")).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<Node {...defaultProps} />);

    await user.click(screen.getByTitle("Delete this node"));

    expect(defaultProps.onDelete).toHaveBeenCalledWith("node-1");
  });

  it("shows branching buttons on desktop", () => {
    render(<Node {...defaultProps} isMobile={false} />);

    expect(screen.getByTitle("Branch from right")).toBeInTheDocument();
    expect(screen.getByTitle("Branch from bottom")).toBeInTheDocument();
  });

  it("hides branching buttons on mobile", () => {
    render(<Node {...defaultProps} isMobile={true} />);

    expect(screen.queryByTitle("Branch from right")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Branch from bottom")).not.toBeInTheDocument();
  });

  it("calls onBranch with correct direction", async () => {
    const user = userEvent.setup();
    render(<Node {...defaultProps} />);

    await user.click(screen.getByTitle("Branch from right"));
    expect(defaultProps.onBranch).toHaveBeenCalledWith("node-1", "right");

    await user.click(screen.getByTitle("Branch from bottom"));
    expect(defaultProps.onBranch).toHaveBeenCalledWith("node-1", "bottom");
  });

  it("only shows messages from startIndex", () => {
    const node: ChatNode = {
      ...baseNode,
      startIndex: 1,
      messages: [
        { role: "user", content: "Hidden parent message" },
        { role: "user", content: "Visible branch message" },
      ],
    };
    render(<Node {...defaultProps} node={node} />);

    expect(screen.queryByText("Hidden parent message")).not.toBeInTheDocument();
    expect(screen.getByText("Visible branch message")).toBeInTheDocument();
  });
});
