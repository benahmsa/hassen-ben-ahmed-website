import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchArchiveItems,
  fetchBiographyContent,
  fetchBlogPostBySlug,
  fetchBlogPosts,
  fetchHomeData,
  fetchInterviewsByCategory,
  fetchNewsItems,
  fetchPressItems,
} from "./public-content.server";

const categorySchema = z.object({ category: z.enum(["commentary", "media"]) });
const slugSchema = z.object({ slug: z.string().min(1).max(240) });

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => fetchHomeData());

export const getBiographyContent = createServerFn({ method: "GET" }).handler(async () =>
  fetchBiographyContent(),
);

export const getNewsItems = createServerFn({ method: "GET" }).handler(async () => fetchNewsItems());

export const getPressItems = createServerFn({ method: "GET" }).handler(async () =>
  fetchPressItems(),
);

export const getArchiveItems = createServerFn({ method: "GET" }).handler(async () =>
  fetchArchiveItems(),
);

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () => fetchBlogPosts());

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .validator((data) => slugSchema.parse(data))
  .handler(async ({ data }) => fetchBlogPostBySlug(data.slug));

export const getInterviewsByCategory = createServerFn({ method: "GET" })
  .validator((data) => categorySchema.parse(data))
  .handler(async ({ data }) => fetchInterviewsByCategory(data.category));