// All photographs are from Unsplash and load straight from its image server.
const photo = (id, width, height) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export const IMAGES = {
  hero: photo('photo-1735052712464-9d24b69be5f5', 2000, 1300),
  heroMobile: photo('photo-1735052712464-9d24b69be5f5', 900, 1400),
  invitation: photo('photo-1770757685390-ecdfac51d95e', 900, 1125),
  gift: photo('photo-1764385827253-3d0a5eb813fe', 900, 1200),
  stage: photo('photo-1727430256509-0f897d6f4765', 900, 1125),
  honeymoon: photo('photo-1735052712489-f45220126a0c', 900, 1200),
  home: photo('photo-1783188223242-07c15cabbf18', 900, 1200),
  car: photo('photo-1772127822562-a898d9f5733c', 900, 1200),
  education: photo('photo-1758080158383-c637e847da1b', 900, 1200),
  loan: photo('photo-1772127822514-682aeffcc0d3', 900, 1200),
};
