export const dashboardStats = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      monthlyUsers: [
        { month: "Sep", count: 12 },
        { month: "Oct", count: 25 },
        { month: "Nov", count: 40 },
      ],
      userStatus: {
        active: 80,
        pending: 20,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard error" });
  }
};