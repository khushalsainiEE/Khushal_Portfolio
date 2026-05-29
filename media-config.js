/**
 * Portfolio media — photos in assets/images/, videos via YouTube / external links.
 */
const PORTFOLIO_MEDIA = {
  hero: {
    image: 'assets/images/hero.JPG',
    alt: 'Khushal Saini',
  },

  photos: [
    { src: 'assets/images/photo-1.jpg', label: 'ASU Sparky', alt: 'ASU Sparky' },
    { src: 'assets/images/photo-2.PNG', label: 'Hindu Yuva ASU', alt: 'Hindu Yuva ASU' },
    { src: 'assets/images/photo-3.JPG', label: 'Devil Palooza', alt: 'Devil Palooza' },
  ],

  showreel: {
    type: 'youtube',
    url: 'https://youtu.be/YgXusYEIP94',
  },

  videos: {
    devlabs: {
      title: 'Team DevLabs',
      type: 'youtube',
      url: 'https://youtu.be/YgXusYEIP94',
    },
    devspace: {
      title: 'DevSpace',
      type: 'youtube',
      url: 'https://youtube.com/shorts/ibNgZQlYSCM',
    },
    marketing101: {
      title: 'Marketing 101',
      type: 'youtube',
      url: 'https://youtube.com/shorts/6kJu9nWQiTM',
    },
    recap25: {
      title: 'Recap in 25 Seconds',
      type: 'youtube',
      url: 'https://youtube.com/shorts/S3GYzalZgxQ',
    },
    launch: {
      title: 'Launch Into Learning',
      type: 'youtube',
      url: 'https://youtube.com/shorts/5VTnpdJkXJk',
    },
    meetings: {
      title: 'Meetings Intro',
      type: 'youtube',
      url: 'https://youtube.com/shorts/AO1VCFzFgeI',
    },
    codeathon: {
      title: 'Code-a-Thon',
      type: 'youtube',
      url: 'https://youtube.com/shorts/O4KAkXnGlTs',
    },
    anime: {
      title: 'Anime Edit',
      type: 'youtube',
      url: 'https://youtu.be/PI9cmjUz1-Q',
    },
  /* Instagram cannot be embedded on custom sites — opens in a new tab */
    truelove: {
      title: 'True Love',
      type: 'external',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/C7ra5A1PWKy/',
    },
  },
};
