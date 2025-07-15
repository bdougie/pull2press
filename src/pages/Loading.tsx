import { useState, useEffect } from "react";
import { EnhancedLoadingProgress, EnhancedFetchProgress } from "../components/enhanced-loading-progress";

export default function Loading() {
  const [progress, setProgress] = useState<EnhancedFetchProgress>({
    stage: 'pr_details',
    progress: 0,
    message: 'Starting...'
  });

  // Simulate progress for demo
  useEffect(() => {
    const stages: Array<EnhancedFetchProgress> = [
      {
        stage: 'pr_details',
        progress: 5,
        message: 'Connecting to GitHub...'
      },
      {
        stage: 'pr_details',
        progress: 15,
        message: 'Fetching pull request details...'
      },
      {
        stage: 'pr_details',
        progress: 20,
        message: 'Looking at comments...',
        details: {
          isAnalyzingComments: true
        }
      },
      {
        stage: 'commits',
        progress: 30,
        message: 'Analyzing commits...',
        details: {
          currentCommit: 1,
          commitCount: 5
        }
      },
      {
        stage: 'commits',
        progress: 40,
        message: 'Analyzing commits...',
        details: {
          currentCommit: 3,
          commitCount: 5
        }
      },
      {
        stage: 'files',
        progress: 50,
        message: 'Processing changed files...',
        details: {
          currentFile: 'src/components/Button.tsx',
          totalFiles: 8,
          currentFileIndex: 1
        }
      },
      {
        stage: 'files',
        progress: 60,
        message: 'Looking at file: src/lib/utils.ts',
        details: {
          currentFile: 'src/lib/utils.ts',
          totalFiles: 8,
          currentFileIndex: 4
        }
      },
      {
        stage: 'files',
        progress: 70,
        message: 'Looking at file: src/pages/Home.tsx',
        details: {
          currentFile: 'src/pages/Home.tsx',
          totalFiles: 8,
          currentFileIndex: 7
        }
      },
      {
        stage: 'generating',
        progress: 85,
        message: 'Creating your blog post with AI...'
      },
      {
        stage: 'generating',
        progress: 95,
        message: 'Finalizing content...'
      },
      {
        stage: 'complete',
        progress: 100,
        message: 'Success! Your blog post is ready.'
      }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < stages.length) {
        setProgress(stages[index]);
        index++;
      } else {
        // Reset to beginning
        index = 0;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <EnhancedLoadingProgress progress={progress} />
    </div>
  );
}