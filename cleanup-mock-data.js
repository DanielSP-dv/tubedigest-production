const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const cleanupMockData = async () => {
  console.log('🧹 Cleaning up mock data...');
  
  try {
    // First, find all mock videos
    const mockVideos = await prisma.video.findMany({
      where: {
        title: {
          contains: 'Mock'
        }
      },
      select: { id: true }
    });
    
    console.log(`Found ${mockVideos.length} mock videos to delete`);
    
    if (mockVideos.length > 0) {
      const videoIds = mockVideos.map(v => v.id);
      
      // Delete related data first (foreign key constraints)
      await prisma.digestItem.deleteMany({
        where: {
          videoId: { in: videoIds }
        }
      });
      
      await prisma.summary.deleteMany({
        where: {
          videoId: { in: videoIds }
        }
      });
      
      await prisma.chapter.deleteMany({
        where: {
          videoId: { in: videoIds }
        }
      });
      
      await prisma.transcript.deleteMany({
        where: {
          videoId: { in: videoIds }
        }
      });
      
      // Finally delete the videos
      const deletedVideos = await prisma.video.deleteMany({
        where: {
          id: { in: videoIds }
        }
      });
      
      console.log(`✅ Deleted ${deletedVideos.count} mock videos and related data`);
    }
    
    console.log('🎉 Mock data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up mock data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

cleanupMockData();
