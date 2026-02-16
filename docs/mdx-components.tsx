import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

function Tabs({
  items,
  children,
  defaultIndex = 0,
}: {
  items: string[];
  children: ReactNode;
  defaultIndex?: number;
}) {
  const defaultValue = items[Math.min(defaultIndex, Math.max(items.length - 1, 0))];

  return (
    <CodeBlockTabs defaultValue={defaultValue}>
      <CodeBlockTabsList>
        {items.map((item) => (
          <CodeBlockTabsTrigger key={item} value={item}>
            {item}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {children}
    </CodeBlockTabs>
  );
}

function Tab({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return <CodeBlockTab value={value}>{children}</CodeBlockTab>;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    Files,
    Folder,
    File,
    ...components,
  };
}
