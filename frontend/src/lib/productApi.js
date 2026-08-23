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