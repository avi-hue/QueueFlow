import os

file_path = "server/src/services/queueService.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

helper_function = """
/**
 * Calculate dynamic average service time based on completed tokens
 */
async function getDynamicAvgServiceTime(business, queue) {
  const defaultAvg = business?.settings?.avgServiceTimeDefault || 5;
  const completedTokens = await Token.find({ queueId: queue._id, status: 'completed' });
  
  if (!completedTokens || completedTokens.length === 0) {
    return defaultAvg;
  }

  let totalMinutes = 0;
  let validCount = 0;

  for (const token of completedTokens) {
    const start = token.serviceStartedAt || token.calledAt;
    const end = token.completedAt;
    if (start && end) {
      const diffMs = new Date(end) - new Date(start);
      const diffMins = diffMs / (1000 * 60);
      if (diffMins >= 0) {
        totalMinutes += diffMins;
        validCount++;
      }
    }
  }

  if (validCount === 0) return defaultAvg;
  return totalMinutes / validCount;
}

/**
 * Get or initialize today's queue for a given business
 */"""

content = content.replace("/**\n * Get or initialize today's queue for a given business\n */", helper_function)

# Update joinQueue
content = content.replace(
    "const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;\n  const estimatedWaitAtJoin = waitingAhead * avgServiceTime;",
    "const avgServiceTime = await getDynamicAvgServiceTime(business, queue);\n  const estimatedWaitAtJoin = Math.round(waitingAhead * avgServiceTime);"
)

# Update addWalkIn
content = content.replace(
    "const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;\n  const estimatedWaitAtJoin = waitingAhead * avgServiceTime;",
    "const avgServiceTime = await getDynamicAvgServiceTime(business, queue);\n  const estimatedWaitAtJoin = Math.round(waitingAhead * avgServiceTime);"
)

# Update getQueueState
content = content.replace(
    "const avgServiceTime = business.settings?.avgServiceTimeDefault || 5;\n  const estimatedWaitMins = waitingTokens.length * avgServiceTime;",
    "const avgServiceTime = await getDynamicAvgServiceTime(business, queue);\n  const estimatedWaitMins = Math.round(waitingTokens.length * avgServiceTime);"
)

# Update getUserActiveToken
content = content.replace(
    "const avgServiceTime = business?.settings?.avgServiceTimeDefault || 5;\n  const estimatedWaitMins = Math.max(0, (position - 1) * avgServiceTime);",
    "const avgServiceTime = await getDynamicAvgServiceTime(business, queue);\n  const estimatedWaitMins = Math.round(Math.max(0, (position - 1) * avgServiceTime));"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated queueService.js successfully!")
