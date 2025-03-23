// analysis/historyAnalyzer.js
/* eslint-env node */
/* global console */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { outputDir } from '../outputPath.js';

// Create git cache directory within the dated output folder
const gitCacheDir = path.join(outputDir, 'git-cache');
if (!fs.existsSync(gitCacheDir)) {
  fs.mkdirSync(gitCacheDir, { recursive: true });
}

export async function analyzeCodeHistory(baseDir) {
  console.log('Analyzing code history...');
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { 
      cwd: baseDir,
      stdio: 'ignore' 
    });
  } catch (gitError) {
    console.error(`Not a git repository or git is not installed: ${gitError.message}`);
    return {
      error: `Not a git repository or git is not installed: ${gitError.message}`,
      authors: [],
      commitActivity: [],
      fileActivity: []
    };
  }
  
  try {
    // Get repository age
    const firstCommitDate = execSync(
      'git log --reverse --format=%ad --date=iso | head -1',
      { cwd: baseDir, encoding: 'utf8' }
    ).trim();
    
    const repoAge = {
      firstCommit: firstCommitDate,
      daysSinceCreation: Math.floor((Date.now() - new Date(firstCommitDate).getTime()) / (1000 * 60 * 60 * 24))
    };
    
    // Get author statistics
    const authorStats = getAuthorStats(baseDir);
    
    // Get file activity
    const fileActivity = getFileActivity(baseDir);
    
    // Get commit activity over time (by week)
    const commitActivity = getCommitActivity(baseDir);
    
    // Get branch information
    const branchInfo = getBranchInfo(baseDir);
    
    // Compile the results
    return {
      repoAge,
      authors: authorStats,
      commitActivity,
      fileActivity,
      branches: branchInfo
    };
  } catch (error) {
    console.error(`Error analyzing git history: ${error.message}`);
    return {
      error: error.message,
      authors: [],
      commitActivity: [],
      fileActivity: []
    };
  }
}

// Get author statistics
function getAuthorStats(baseDir) {
  // Get author commit counts
  const authorCommits = execSync(
    'git shortlog -sne --no-merges HEAD',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^\s*(\d+)\s+(.+)\s+<(.+)>$/);
      if (match) {
        return {
          commits: parseInt(match[1], 10),
          name: match[2],
          email: match[3]
        };
      }
      return null;
    })
    .filter(Boolean);
  
  // Get more detailed stats for top contributors
  return authorCommits.slice(0, 10).map(author => {
    try {
      // Get files changed by author
      const filesChanged = execSync(
        `git log --author="${author.email}" --pretty=format: --name-only | sort | uniq | wc -l`,
        { cwd: baseDir, encoding: 'utf8' }
      ).trim();
      
      // Get lines added/removed
      const linesStats = execSync(
        `git log --author="${author.email}" --pretty=tformat: --numstat | awk '{ added += $1; removed += $2 } END { print added " " removed }'`,
        { cwd: baseDir, encoding: 'utf8' }
      ).trim().split(' ');
      
      // Get first commit date
      const firstCommit = execSync(
        `git log --author="${author.email}" --reverse --format=%ad --date=iso | head -1`,
        { cwd: baseDir, encoding: 'utf8' }
      ).trim();
      
      // Get last commit date
      const lastCommit = execSync(
        `git log --author="${author.email}" --format=%ad --date=iso | head -1`,
        { cwd: baseDir, encoding: 'utf8' }
      ).trim();
      
      return {
        ...author,
        filesChanged: parseInt(filesChanged, 10),
        linesAdded: parseInt(linesStats[0] || 0, 10),
        linesRemoved: parseInt(linesStats[1] || 0, 10),
        firstCommit,
        lastCommit,
        activeDays: Math.floor((new Date(lastCommit).getTime() - new Date(firstCommit).getTime()) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error(`Error getting stats for author ${author.name}: ${error.message}`);
      return author;
    }
  });
}

// Get file activity
function getFileActivity(baseDir) {
  // Get most frequently changed files
  const fileChanges = execSync(
    'git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
      if (match) {
        return {
          changes: parseInt(match[1], 10),
          file: match[2]
        };
      }
      return null;
    })
    .filter(Boolean);
  
  // Get recently changed files
  const recentChanges = execSync(
    'git log --name-only --pretty=format: --since="1 month ago" | sort | uniq -c | sort -rn | head -20',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
      if (match) {
        return {
          changes: parseInt(match[1], 10),
          file: match[2]
        };
      }
      return null;
    })
    .filter(Boolean);
  
  return {
    mostChanged: fileChanges,
    recentlyChanged: recentChanges
  };
}

// Get commit activity over time
function getCommitActivity(baseDir) {
  // Get weekly commit counts
  const weeklyActivity = execSync(
    'git log --pretty=format:%ad --date=format:%Y-%W | sort | uniq -c',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
      if (match) {
        return {
          week: match[2],
          commits: parseInt(match[1], 10)
        };
      }
      return null;
    })
    .filter(Boolean);
  
  // Get monthly commit counts
  const monthlyActivity = execSync(
    'git log --pretty=format:%ad --date=format:%Y-%m | sort | uniq -c',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => {
      const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
      if (match) {
        return {
          month: match[2],
          commits: parseInt(match[1], 10)
        };
      }
      return null;
    })
    .filter(Boolean);
  
  return {
    weekly: weeklyActivity,
    monthly: monthlyActivity
  };
}

// Get branch information
function getBranchInfo(baseDir) {
  // Get all branches
  const branches = execSync(
    'git branch -a',
    { cwd: baseDir, encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .map(line => line.replace(/^\s*[*\s]+/, '').trim())
    .filter(Boolean);
  
  // Get current branch
  const currentBranch = execSync(
    'git rev-parse --abbrev-ref HEAD',
    { cwd: baseDir, encoding: 'utf8' }
  ).trim();
  
  return {
    all: branches,
    current: currentBranch,
    count: branches.length
  };
}