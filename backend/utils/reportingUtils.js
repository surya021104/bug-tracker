import Issue from "../models/Issue.js";

/**
 * Convert a timeRange string to a start date.
 * Returns null for 'all' (no filter).
 */
function getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
        case 'today': {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return start;
        }
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'all':
        default:
            return null; // no filter
    }
}

/**
 * Get the number of days a velocity chart should span for the given range.
 */
function getVelocityDays(timeRange) {
    switch (timeRange) {
        case 'today': return 1;
        case '7d': return 7;
        case '30d': return 30;
        case '90d': return 90;
        case 'all':
        default: return 30;
    }
}

/**
 * Get comprehensive analytics for the Reports page.
 * Respects the timeRange parameter to filter data.
 */
export async function getComprehensiveAnalytics(timeRange = 'all', appName = null) {
    try {
        const startDate = getStartDate(timeRange);

        // Build query filter — combine time + app filters
        const filter = {};
        if (startDate) filter.createdAt = { $gte: startDate };
        if (appName && appName !== 'all') filter.appName = appName;

        // Get filtered bugs
        const filteredBugs = await Issue.find(filter).lean();

        // Calculate MTTR (Mean Time To Resolution)
        const resolvedBugs = filteredBugs.filter(
            b => b.status === "Resolved" || b.status === "Closed" || b.status === "Fixed"
        );

        // Bug velocity
        const velocityDays = getVelocityDays(timeRange);
        const velocity = calculateBugVelocity(filteredBugs, velocityDays);

        // Severity distribution
        const severityStats = {
            Critical: filteredBugs.filter(b => b.severity === "Critical").length,
            High: filteredBugs.filter(b => b.severity === "High").length,
            Medium: filteredBugs.filter(b => b.severity === "Medium").length,
            Low: filteredBugs.filter(b => b.severity === "Low").length
        };

        // Status distribution
        const statusStats = {
            Open: filteredBugs.filter(b => b.status === "Open" || b.status === "New").length,
            "In Progress": filteredBugs.filter(b => b.status === "In Progress").length,
            Resolved: resolvedBugs.length,
            Closed: filteredBugs.filter(b => b.status === "Closed").length
        };

        // Module distribution (Hotspots)
        const moduleStats = {};
        filteredBugs.forEach(bug => {
            const mod = bug.module || "Unknown";
            moduleStats[mod] = (moduleStats[mod] || 0) + 1;
        });

        // Source distribution (Auto vs Manual)
        const sourceStats = {
            Automated: filteredBugs.filter(b => b.isAuto).length,
            Manual: filteredBugs.filter(b => !b.isAuto).length
        };

        // Environment distribution
        const envStats = {};
        filteredBugs.forEach(bug => {
            const env = bug.environment || "Unknown";
            envStats[env] = (envStats[env] || 0) + 1;
        });

        // Top Recurring Issues (Top 5 by occurrences)
        const topRecurring = filteredBugs
            .slice()
            .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1))
            .slice(0, 5)
            .map(b => ({
                id: b.id,
                title: b.title,
                occurrences: b.occurrences || 1,
                module: b.module || 'Unknown',
                severity: b.severity
            }));

        // Top Impacting Issues
        const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const topImpactingIssues = filteredBugs
            .slice()
            .sort((a, b) => {
                const aUsers = a.affectedUsers || 0;
                const bUsers = b.affectedUsers || 0;
                if (bUsers !== aUsers) return bUsers - aUsers;
                const aOcc = a.occurrences || 1;
                const bOcc = b.occurrences || 1;
                if (bOcc !== aOcc) return bOcc - aOcc;
                const aW = severityWeight[a.severity] || 0;
                const bW = severityWeight[b.severity] || 0;
                return bW - aW;
            })
            .slice(0, 5)
            .map(b => ({
                id: b.id,
                title: b.title,
                module: b.module || 'Unknown',
                severity: b.severity,
                occurrences: b.occurrences || 1,
                affectedUsers: b.affectedUsers || 0,
                affectedSessions: b.affectedSessions || 0
            }));

        // Trends: compare current period to previous equivalent period
        const periodMs = startDate ? (Date.now() - startDate.getTime()) : 7 * 24 * 60 * 60 * 1000;
        const trendPrevStart = startDate
            ? new Date(startDate.getTime() - periodMs)
            : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const trendPrevEnd = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const previousPeriod = await Issue.find({
            createdAt: { $gte: trendPrevStart, $lt: trendPrevEnd }
        }).lean();

        const trends = {
            totalBugs: calculateTrend(filteredBugs.length, previousPeriod.length),
            openBugs: calculateTrend(
                filteredBugs.filter(b => b.status === "Open").length,
                previousPeriod.filter(b => b.status === "Open").length
            ),
            criticalBugs: calculateTrend(
                filteredBugs.filter(b => b.severity === "Critical").length,
                previousPeriod.filter(b => b.severity === "Critical").length
            )
        };

        // Daily bug count for charts
        const dailyBugCounts = generateDailyBugCounts(filteredBugs, velocityDays);

        // Resolution rate
        const resolutionRate = filteredBugs.length > 0
            ? ((resolvedBugs.length / filteredBugs.length) * 100).toFixed(1)
            : 0;

        // MTTR percentiles
        const mttrDetails = calculateMTTRDetails(resolvedBugs);

        // Reopen rate
        const reopenedBugs = filteredBugs.filter(b => b.reopened || b.reopenCount > 0);
        const reopenRateValue = resolvedBugs.length > 0
            ? ((reopenedBugs.length / resolvedBugs.length) * 100).toFixed(1)
            : 0;

        // First response time (mock if not tracked)
        const firstResponseAvg = 4;

        // Bug Aging — how long open bugs have been sitting
        const openBugs = filteredBugs.filter(
            b => b.status === 'Todo' || b.status === 'Open' || b.status === 'New' || b.status === 'In Progress'
        );
        const nowMs = Date.now();
        const bugAging = { today: 0, days1to3: 0, days3to7: 0, weeks1to2: 0, weeks2plus: 0 };
        openBugs.forEach(b => {
            const ageMs = nowMs - new Date(b.createdAt).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            if (ageDays < 1) bugAging.today++;
            else if (ageDays < 3) bugAging.days1to3++;
            else if (ageDays < 7) bugAging.days3to7++;
            else if (ageDays < 14) bugAging.weeks1to2++;
            else bugAging.weeks2plus++;
        });

        return {
            summary: {
                total: filteredBugs.length,
                active: statusStats.Open + statusStats["In Progress"],
                resolved: resolvedBugs.length,
                critical: severityStats.Critical,
                resolutionRate: parseFloat(resolutionRate)
            },
            mttr: {
                average: mttrDetails.average,
                median: mttrDetails.median,
                p75: mttrDetails.p75,
                p90: mttrDetails.p90,
                p95: mttrDetails.p95,
                count: resolvedBugs.length
            },
            trends,
            severityDistribution: severityStats,
            statusDistribution: statusStats,
            typeDistribution: moduleStats,
            moduleDistribution: moduleStats,
            sourceDistribution: sourceStats,
            environmentDistribution: envStats,
            topRecurringIssues: topRecurring,
            topImpactingIssues,
            velocity,
            dailyBugCounts,
            bugAging,
            teamPerformance: [],
            firstResponseTime: {
                average: firstResponseAvg,
                median: firstResponseAvg
            },
            reopenRate: {
                rate: parseFloat(reopenRateValue),
                reopened: reopenedBugs.length
            }
        };
    } catch (error) {
        console.error("Analytics calculation error:", error);
        throw error;
    }
}

/**
 * Get trend comparison for a specific period
 */
export async function getTrendComparison(period = '7d') {
    try {
        const days = period === '30d' ? 30 : 7;
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const previousStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

        const currentPeriod = await Issue.find({ createdAt: { $gte: startDate } }).lean();
        const previousPeriod = await Issue.find({
            createdAt: { $gte: previousStart, $lt: startDate }
        }).lean();

        return {
            current: {
                total: currentPeriod.length,
                open: currentPeriod.filter(b => b.status === "Open").length,
                resolved: currentPeriod.filter(b => b.status === "Resolved" || b.status === "Closed").length,
                critical: currentPeriod.filter(b => b.severity === "Critical").length
            },
            previous: {
                total: previousPeriod.length,
                open: previousPeriod.filter(b => b.status === "Open").length,
                resolved: previousPeriod.filter(b => b.status === "Resolved" || b.status === "Closed").length,
                critical: previousPeriod.filter(b => b.severity === "Critical").length
            },
            change: {
                total: calculateTrend(currentPeriod.length, previousPeriod.length),
                open: calculateTrend(
                    currentPeriod.filter(b => b.status === "Open").length,
                    previousPeriod.filter(b => b.status === "Open").length
                ),
                resolved: calculateTrend(
                    currentPeriod.filter(b => b.status === "Resolved" || b.status === "Closed").length,
                    previousPeriod.filter(b => b.status === "Resolved" || b.status === "Closed").length
                ),
                critical: calculateTrend(
                    currentPeriod.filter(b => b.severity === "Critical").length,
                    previousPeriod.filter(b => b.severity === "Critical").length
                )
            }
        };
    } catch (error) {
        console.error("Trend comparison error:", error);
        throw error;
    }
}

/**
 * Calculate Mean Time To Resolution
 */
function calculateMTTR(resolvedBugs) {
    if (resolvedBugs.length === 0) return 0;

    const totalTime = resolvedBugs.reduce((sum, bug) => {
        if (bug.resolvedAt && bug.createdAt) {
            const resolutionTime = new Date(bug.resolvedAt) - new Date(bug.createdAt);
            return sum + resolutionTime;
        }
        return sum;
    }, 0);

    const averageMs = totalTime / resolvedBugs.length;
    return Math.round(averageMs / (1000 * 60 * 60));
}

/**
 * Calculate detailed MTTR with percentiles
 */
function calculateMTTRDetails(resolvedBugs) {
    if (resolvedBugs.length === 0) {
        return { average: 0, median: 0, p75: 0, p90: 0, p95: 0 };
    }

    const resolutionTimes = resolvedBugs
        .filter(bug => bug.resolvedAt && bug.createdAt)
        .map(bug => {
            const timeMs = new Date(bug.resolvedAt) - new Date(bug.createdAt);
            return Math.round(timeMs / (1000 * 60 * 60));
        })
        .sort((a, b) => a - b);

    if (resolutionTimes.length === 0) {
        return { average: 0, median: 0, p75: 0, p90: 0, p95: 0 };
    }

    const average = Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length);
    const median = resolutionTimes[Math.floor(resolutionTimes.length * 0.5)] || 0;
    const p75 = resolutionTimes[Math.floor(resolutionTimes.length * 0.75)] || 0;
    const p90 = resolutionTimes[Math.floor(resolutionTimes.length * 0.90)] || 0;
    const p95 = resolutionTimes[Math.floor(resolutionTimes.length * 0.95)] || 0;

    return { average, median, p75, p90, p95 };
}

/**
 * Calculate bug velocity (opened vs closed per day)
 */
function calculateBugVelocity(bugs, days = 30) {
    const velocityData = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const opened = bugs.filter(b => {
            const created = new Date(b.createdAt);
            return created >= dayStart && created <= dayEnd;
        }).length;

        const closed = bugs.filter(b => {
            if (!b.resolvedAt) return false;
            const resolved = new Date(b.resolvedAt);
            return resolved >= dayStart && resolved <= dayEnd;
        }).length;

        velocityData.push({
            date: dayStart.toISOString().split('T')[0],
            opened,
            closed
        });
    }

    return velocityData;
}

/**
 * Generate daily bug counts for chart
 */
function generateDailyBugCounts(bugs, days) {
    const dailyCounts = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const count = bugs.filter(b => {
            const created = new Date(b.createdAt);
            return created >= dayStart && created <= dayEnd;
        }).length;

        dailyCounts.push({
            date: dayStart.toISOString().split('T')[0],
            count
        });
    }

    return dailyCounts;
}

/**
 * Calculate trend percentage
 */
function calculateTrend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Get distinct application names for the filter dropdown
 */
export async function getDistinctApps() {
    try {
        const apps = await Issue.distinct('appName');
        return apps.filter(Boolean).sort();
    } catch (error) {
        console.error("Failed to get distinct apps:", error);
        return [];
    }
}
