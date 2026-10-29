import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function fetchProducts() {
  const { data } = await axios.get(`${API}/products`);
  return data;
}

export async function fetchCategories() {
  const { data } = await axios.get(`${API}/categories`);
  return data;
}
export async function fetchProductRecommendations(productId) {
  const { data } = await axios.get(
    `${API}/products/${productId}/recommendations`
  );
  return data;
}
export async function fetchFrequentlyBoughtTogether(productId) {
  const { data } = await axios.get(
    `${API}/products/${productId}/frequently-bought-together`
  );
  return data;
}
export async function playRewardGame(game) {
  const { data } = await axios.post(
    `${API}/games/play`,
    { game },
    { withCredentials: true }
  );

  return data;
}
