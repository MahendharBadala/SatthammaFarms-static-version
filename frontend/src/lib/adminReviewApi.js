import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function fetchAdminReviews(status = "") {
  const params = status ? { status } : {};

  const { data } = await axios.get(
    `${API}/admin/reviews`,
    {
      params,
      withCredentials: true,
    }
  );

  return data;
}

export async function approveReview(reviewId) {
  const { data } = await axios.put(
    `${API}/admin/reviews/${reviewId}`,
    {
      status: "approved",
    },
    {
      withCredentials: true,
    }
  );

  return data;
}

export async function rejectReview(reviewId) {
  const { data } = await axios.put(
    `${API}/admin/reviews/${reviewId}`,
    {
      status: "rejected",
    },
    {
      withCredentials: true,
    }
  );

  return data;
}

export async function deleteReview(reviewId) {
  const { data } = await axios.delete(
    `${API}/admin/reviews/${reviewId}`,
    {
      withCredentials: true,
    }
  );

  return data;
}

export async function respondToReview(reviewId, response) {
  const { data } = await axios.put(
    `${API}/admin/reviews/${reviewId}`,
    {
      admin_response: response,
    },
    {
      withCredentials: true,
    }
  );

  return data;
}
