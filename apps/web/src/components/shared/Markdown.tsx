import React from "react";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;

  // Split by newlines to process line by line
  const lines = content.split("\n");

  const rendered = lines.map((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={index} className="text-xl font-black mt-6 mb-3 text-foreground tracking-tight border-b pb-1 first:mt-0">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-foreground tracking-tight">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={index} className="text-2xl font-black mt-8 mb-4 text-foreground tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    }

    // List items
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      if (match) {
        return (
          <div key={index} className="pl-4 my-2 flex gap-2.5 text-sm leading-relaxed items-start">
            <span className="font-bold text-primary shrink-0 select-none">{match[1]}.</span>
            <span className="text-foreground/90">{renderInline(match[2])}</span>
          </div>
        );
      }
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={index} className="pl-4 my-2 flex gap-2.5 text-sm leading-relaxed items-start">
          <span className="text-primary shrink-0 select-none">•</span>
          <span className="text-foreground/90">{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Empty lines
    if (trimmed === "") {
      return <div key={index} className="h-3" />;
    }

    // Indented block (typically details/subtext of list items)
    if (line.startsWith("   ")) {
      return (
        <div key={index} className="pl-8 text-xs text-muted-foreground leading-relaxed mt-0.5 mb-2 font-medium">
          {renderInline(line.slice(3))}
        </div>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="text-sm leading-relaxed text-foreground/90 my-2">
        {renderInline(line)}
      </p>
    );
  });

  return <div className={className}>{rendered}</div>;
}

// Simple inline parser for bold **text** and italic *text*
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const italicMatch = remaining.match(/\*(.*?)\*/);

    let match: RegExpMatchArray | null = null;
    let type: "bold" | "italic" = "bold";

    if (boldMatch && italicMatch) {
      if (boldMatch.index! < italicMatch.index!) {
        match = boldMatch;
        type = "bold";
      } else {
        match = italicMatch;
        type = "italic";
      }
    } else if (boldMatch) {
      match = boldMatch;
      type = "bold";
    } else if (italicMatch) {
      match = italicMatch;
      type = "italic";
    }

    if (!match) {
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }

    const index = match.index!;
    const matchedText = match[0];
    const innerText = match[1];

    // Push preceding text
    if (index > 0) {
      parts.push(<span key={keyIdx++}>{remaining.slice(0, index)}</span>);
    }

    // Push formatted text
    if (type === "bold") {
      parts.push(<strong key={keyIdx++} className="font-extrabold text-foreground">{innerText}</strong>);
    } else {
      parts.push(<em key={keyIdx++} className="italic text-foreground/80">{innerText}</em>);
    }

    remaining = remaining.slice(index + matchedText.length);
  }

  return parts;
}
