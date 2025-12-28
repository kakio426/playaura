const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function getPopularChannelIds(categoryId: string, maxResults = 20) {
    const url = `${BASE_URL}/videos?part=snippet&chart=mostPopular&videoCategoryId=${categoryId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    const channelIds = data.items.map((item: any) => item.snippet.channelId);
    return [...new Set(channelIds)] as string[];
}

export async function getChannelsDetails(channelIds: string[]) {
    if (channelIds.length === 0) return [];
    const ids = channelIds.join(',');
    const url = `${BASE_URL}/channels?part=snippet,statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    return data.items.map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        handle: item.snippet.customUrl,
        description: item.snippet.description,
        thumbnail_url: item.snippet.thumbnails.medium.url,
        subscribers: parseInt(item.statistics.subscriberCount) || 0,
        totalViews: parseInt(item.statistics.viewCount) || 0,
        totalVideos: parseInt(item.statistics.videoCount) || 0,
    }));
}
