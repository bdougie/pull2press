import { Loader2, GitPullRequest, FileCode, Sparkles, CheckCircle, MessageSquare, FileText } from "lucide-react";
import { FetchProgress } from "../lib/github-optimized";

export interface EnhancedFetchProgress extends FetchProgress {
  details?: {
    currentFile?: string;
    totalFiles?: number;
    currentFileIndex?: number;
    isAnalyzingComments?: boolean;
    commitCount?: number;
    currentCommit?: number;
  };
}

interface EnhancedLoadingProgressProps {
  progress: EnhancedFetchProgress;
}

export function EnhancedLoadingProgress({ progress }: EnhancedLoadingProgressProps) {
  const getIcon = () => {
    if (progress.details?.isAnalyzingComments) {
      return <MessageSquare className="h-5 w-5" />;
    }
    if (progress.details?.currentFile) {
      return <FileText className="h-5 w-5" />;
    }
    
    switch (progress.stage) {
      case 'pr_details':
        return <GitPullRequest className="h-5 w-5" />;
      case 'commits':
        return <FileCode className="h-5 w-5" />;
      case 'files':
        return <FileCode className="h-5 w-5" />;
      case 'generating':
        return <Sparkles className="h-5 w-5" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getDetailedMessage = () => {
    if (progress.details?.isAnalyzingComments) {
      return 'Looking at comments...';
    }
    
    if (progress.details?.currentFile) {
      return `Looking at file: ${progress.details.currentFile}`;
    }
    
    if (progress.details?.currentCommit && progress.details?.commitCount) {
      return `Analyzing commit ${progress.details.currentCommit} of ${progress.details.commitCount}`;
    }
    
    if (progress.details?.currentFileIndex && progress.details?.totalFiles) {
      return `Processing file ${progress.details.currentFileIndex} of ${progress.details.totalFiles}`;
    }
    
    return progress.message;
  };

  const getStageText = () => {
    switch (progress.stage) {
      case 'pr_details':
        return 'Fetching Pull Request Details';
      case 'commits':
        return 'Analyzing Commits';
      case 'files':
        return 'Processing Changed Files';
      case 'generating':
        return 'Generating Blog Content';
      case 'complete':
        return 'Complete!';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-[#d0d7de] rounded-md p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start space-x-3">
            <div className={`${progress.stage === 'complete' ? 'text-green-600' : 'text-[#0969da]'}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#24292f]">
                {getStageText()}
              </h3>
              <p className="text-sm text-[#57606a] mt-1">
                {getDetailedMessage()}
              </p>
            </div>
            <span className="text-sm text-[#57606a]">{progress.progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#eaeef2] rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-[#2da44e] transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          {/* Stage indicators */}
          <div className="flex items-center justify-between text-sm">
            {['Fetching PR data', 'Analyzing changes', 'Generating content'].map((stage, index) => {
              const isActive = 
                (progress.stage === 'pr_details' && index === 0) ||
                ((progress.stage === 'commits' || progress.stage === 'files') && index === 1) ||
                (progress.stage === 'generating' && index === 2);
              
              const isComplete = 
                ((progress.stage === 'commits' || progress.stage === 'files' || progress.stage === 'generating' || progress.stage === 'complete') && index === 0) ||
                ((progress.stage === 'generating' || progress.stage === 'complete') && index === 1) ||
                (progress.stage === 'complete' && index === 2);

              return (
                <div key={stage} className="flex items-center space-x-2">
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    ${isComplete ? 'bg-[#2da44e]' : 
                      isActive ? 'bg-[#0969da]' : 
                      'bg-[#eaeef2]'}
                  `}>
                    {isComplete && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className={`
                    ${isComplete ? 'text-[#24292f]' : 
                      isActive ? 'text-[#24292f] font-medium' : 
                      'text-[#57606a]'}
                  `}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Additional details section */}
          {(progress.details?.currentFile || progress.details?.isAnalyzingComments) && (
            <div className="mt-4 p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md">
              <div className="flex items-center space-x-2">
                <div className="text-[#57606a]">
                  {progress.details?.isAnalyzingComments ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <p className="text-sm text-[#24292f] font-mono">
                  {progress.details?.isAnalyzingComments
                    ? 'Reading PR comments and reviews...'
                    : progress.details?.currentFile}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}