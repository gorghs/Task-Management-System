const analyticsService = require('../services/analytics.service');

// Controller for GET /v1/analytics/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await analyticsService.getLeaderboard();
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    res.status(500).json({ message: 'Failed to get leaderboard.', error: error.message });
  }
};
