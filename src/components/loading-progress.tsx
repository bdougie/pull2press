import { Progress } from "./ui/progress";
import { Loader2, GitPullRequest, FileCode, Sparkles, CheckCircle } from "lucide-react";
import { FetchProgress } from "../lib/github-optimized";

interface LoadingProgressProps {
  progress: FetchProgress;
}

export function LoadingProgress({ progress }: LoadingProgressProps) {
  const getIcon = () => {
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
    <div className="w-full max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="text-blue-600">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {getStageText()}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {progress.message}
          </p>
        </div>
      </div>
      
      <Progress value={progress.progress} className="h-2" />
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>Processing your pull request...</span>
        <span>{progress.progress}%</span>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between mt-4">
        {['Fetch', 'Analyze', 'Generate'].map((stage, index) => {
          const isActive = 
            (progress.stage === 'pr_details' && index === 0) ||
            (progress.stage === 'commits' || progress.stage === 'files') && index === 1 ||
            (progress.stage === 'generating' && index === 2);
          
          const isComplete = 
            (progress.stage === 'commits' || progress.stage === 'files' || progress.stage === 'generating' || progress.stage === 'complete') && index === 0 ||
            (progress.stage === 'generating' || progress.stage === 'complete') && index === 1 ||
            (progress.stage === 'complete' && index === 2);

          return (
            <div key={stage} className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${isComplete ? 'bg-green-100 text-green-700' : 
                  isActive ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                  'bg-gray-100 text-gray-400'}
              `}>
                {index + 1}
              </div>
              <span className="text-xs mt-1 text-gray-600">{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}