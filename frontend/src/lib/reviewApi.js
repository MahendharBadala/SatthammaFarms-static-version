import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Get all approved reviews + rating information for a product
export async function fetchProductReviews(productId) {
  const { data } = await axios.get(
    `${API}/products/${productId}/reviews`,
    {
      withCredentials: true,
    }
  );

  return data;
}

// Upload a customer review photo
export async function uploadReviewPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post(
    `${API}/reviews/upload`,
    formData,
    {
      withCredentials: true,
    }
  );

  return data;
}

// Submit a customer review
export async function submitReview(review) {
  const { data } = await axios.post(
    `${API}/reviews`,
    review,
    {
      withCredentials: true,
    }
  );

  return data;
}
