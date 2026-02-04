const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const CourseInvoice = require('../models/CourseInvoice');
const Lesson = require('../models/Lesson');
const MicroQuizAttempt = require('../models/MicroQuizAttempt');
const User = require('../models/User');

// Get comprehensive course analytics for admin
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 1. Total Enrollments
    const totalEnrollments = await CourseProgress.countDocuments({ courseId });

    // 2. Active Learners (engaged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeLearnersCount = await CourseProgress.countDocuments({
      courseId,
      lastAccessedAt: { $gte: sevenDaysAgo }
    });

    // 3. Completion Statistics
    const completedCount = await CourseProgress.countDocuments({
      courseId,
      status: 'completed'
    });
    const completionPercentage = totalEnrollments > 0 
      ? Math.round((completedCount / totalEnrollments) * 100)
      : 0;

    // 4. Drop-off Analysis - Find where users stop most
    const allProgress = await CourseProgress.find({ courseId })
      .populate('completedLessons.lessonId', 'title lessonOrder');

    const lessons = await Lesson.find({ courseId, isActive: true })
      .sort({ lessonOrder: 1 });

    const lessonDropoffMap = {};
    lessons.forEach(lesson => {
      lessonDropoffMap[lesson._id.toString()] = {
        lessonId: lesson._id,
        title: lesson.title,
        order: lesson.lessonOrder,
        completedBy: 0,
        droppedAfter: 0
      };
    });

    allProgress.forEach(progress => {
      const completedLessonIds = progress.completedLessons.map(cl => 
        cl.lessonId?._id?.toString() || cl.lessonId?.toString()
      );

      lessons.forEach((lesson, index) => {
        const lessonId = lesson._id.toString();
        const isCompleted = completedLessonIds.includes(lessonId);
        
        if (isCompleted) {
          lessonDropoffMap[lessonId].completedBy++;
        }
        
        // If this lesson not completed but previous one was, count as dropped here
        if (!isCompleted && index > 0) {
          const prevLessonId = lessons[index - 1]._id.toString();
          if (completedLessonIds.includes(prevLessonId)) {
            lessonDropoffMap[lessonId].droppedAfter++;
          }
        }
      });
    });

    // Find lesson with highest drop-off rate
    const dropoffData = Object.values(lessonDropoffMap);
    const dropoffLesson = dropoffData.reduce((max, curr) => 
      curr.droppedAfter > (max?.droppedAfter || 0) ? curr : max
    , null);

    // 5. Average Quiz Score
    const quizAttempts = await MicroQuizAttempt.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalAttempts: { $sum: 1 },
          passedAttempts: {
            $sum: { $cond: ['$passed', 1, 0] }
          }
        }
      }
    ]);

    const quizStats = quizAttempts.length > 0 ? quizAttempts[0] : {
      avgScore: 0,
      totalAttempts: 0,
      passedAttempts: 0
    };

    // 6. Payment Analytics (for paid courses)
    let paymentStats = null;
    if (course.isPaid) {
      const payments = await CourseInvoice.find({ 
        courseId,
        paymentStatus: 'paid'
      });

      const totalRevenue = payments.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidEnrollments = payments.length;
      const freeEnrollments = totalEnrollments - paidEnrollments;

      paymentStats = {
        totalRevenue,
        currency: course.currency || 'INR',
        paidEnrollments,
        freeEnrollments,
        averagePrice: paidEnrollments > 0 ? totalRevenue / paidEnrollments : 0
      };
    }

    // 7. Recent Enrollments (last 10 with user details)
    const recentEnrollments = await CourseProgress.find({ courseId })
      .populate('userId', 'name email phone')
      .sort({ enrolledAt: -1 })
      .limit(10)
      .lean();

    // 8. Status Distribution
    const statusDistribution = await CourseProgress.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      enrolled: 0,
      'in-progress': 0,
      completed: 0,
      dropped: 0
    };
    statusDistribution.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    // 9. Average Time Spent
    const timeStats = await CourseProgress.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: null,
          avgTimeSpent: { $avg: '$timeSpent' },
          totalTimeSpent: { $sum: '$timeSpent' }
        }
      }
    ]);

    const timeData = timeStats.length > 0 ? timeStats[0] : {
      avgTimeSpent: 0,
      totalTimeSpent: 0
    };

    res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        isPaid: course.isPaid,
        price: course.price
      },
      overview: {
        totalEnrollments,
        activeLearnersCount,
        completionPercentage,
        completedCount,
        averageTimeSpent: Math.round(timeData.avgTimeSpent || 0),
        totalTimeSpent: Math.round(timeData.totalTimeSpent || 0)
      },
      statusDistribution: statusStats,
      dropoffAnalysis: {
        dropoffLesson: dropoffLesson ? {
          title: dropoffLesson.title,
          order: dropoffLesson.order,
          droppedCount: dropoffLesson.droppedAfter
        } : null,
        lessonStats: dropoffData
      },
      quizPerformance: {
        averageScore: Math.round(quizStats.avgScore || 0),
        totalAttempts: quizStats.totalAttempts,
        passedAttempts: quizStats.passedAttempts,
        passRate: quizStats.totalAttempts > 0 
          ? Math.round((quizStats.passedAttempts / quizStats.totalAttempts) * 100)
          : 0
      },
      paymentStats,
      recentEnrollments: recentEnrollments.map(enrollment => ({
        user: {
          id: enrollment.userId?._id,
          name: enrollment.userId?.name,
          email: enrollment.userId?.email,
          phone: enrollment.userId?.phone
        },
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        timeSpent: enrollment.timeSpent,
        isPaid: enrollment.isPaid,
        paymentAmount: enrollment.paymentAmount
      }))
    });

  } catch (error) {
    console.error('Error fetching course analytics:', error);
    res.status(500).json({
      message: 'Error fetching course analytics',
      error: error.message
    });
  }
};

// Get all enrolled users with payment details for a course
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, status, isPaid } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Build filter
    const filter = { courseId };
    if (status) filter.status = status;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const enrollments = await CourseProgress.find(filter)
      .populate('userId', 'name email phone')
      .sort({ enrolledAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await CourseProgress.countDocuments(filter);

    // Get payment details for paid enrollments
    const enrollmentIds = enrollments.map(e => e._id);
    const paymentMap = {};
    
    if (course.isPaid) {
      const invoices = await CourseInvoice.find({ 
        courseId,
        userId: { $in: enrollments.map(e => e.userId?._id).filter(Boolean) }
      }).lean();

      invoices.forEach(inv => {
        paymentMap[inv.userId.toString()] = {
          invoiceNumber: inv.invoiceNumber,
          amount: inv.totalAmount,
          currency: inv.currency,
          paymentDate: inv.invoiceDate,
          paymentId: inv.razorpayPaymentId
        };
      });
    }

    const enrichedEnrollments = enrollments.map(enrollment => ({
      enrollmentId: enrollment._id,
      user: {
        id: enrollment.userId?._id,
        name: enrollment.userId?.name || 'N/A',
        email: enrollment.userId?.email || 'N/A',
        phone: enrollment.userId?.phone || 'N/A'
      },
      enrollment: {
        enrolledAt: enrollment.enrolledAt,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        completedLessons: enrollment.completedLessons?.length || 0,
        timeSpent: enrollment.timeSpent || 0,
        lastAccessedAt: enrollment.lastAccessedAt
      },
      payment: enrollment.userId ? paymentMap[enrollment.userId._id.toString()] : null
    }));

    res.status(200).json({
      enrollments: enrichedEnrollments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      },
      course: {
        id: course._id,
        title: course.title,
        isPaid: course.isPaid,
        price: course.price
      }
    });

  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Get payment transactions for a course
exports.getCoursePayments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPaid) {
      return res.status(400).json({ message: 'This is a free course' });
    }

    const payments = await CourseInvoice.find({ courseId })
      .populate('userId', 'name email phone')
      .sort({ invoiceDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await CourseInvoice.countDocuments({ courseId });

    const totalRevenue = await CourseInvoice.aggregate([
      { $match: { courseId: course._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      payments: payments.map(payment => ({
        invoiceId: payment._id,
        invoiceNumber: payment.invoiceNumber,
        user: {
          id: payment.userId?._id,
          name: payment.userId?.name || 'N/A',
          email: payment.userId?.email || 'N/A',
          phone: payment.userId?.phone || 'N/A'
        },
        amount: {
          original: payment.originalPrice,
          discount: payment.discountAmount,
          subtotal: payment.subtotal,
          tax: payment.taxAmount,
          total: payment.totalAmount,
          currency: payment.currency
        },
        payment: {
          id: payment.razorpayPaymentId,
          orderId: payment.razorpayOrderId,
          status: payment.paymentStatus,
          date: payment.invoiceDate
        }
      })),
      summary: {
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        currency: course.currency || 'INR',
        totalTransactions: count
      },
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching course payments:', error);
    res.status(500).json({
      message: 'Error fetching payments',
      error: error.message
    });
  }
};
