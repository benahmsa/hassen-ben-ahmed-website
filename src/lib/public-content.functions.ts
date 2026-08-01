import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const categorySchema = z.object({ category: z.enum(["commentary", "media"]) });
const slugSchema = z.object({ slug: z.string().min(1).max(240) });

// The server module is imported lazily inside each handler so that it never
// enters the client bundle (it reads process.env, which does not exist in the browser).
const server = () => import("./public-content.server");

export const getHomeData = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchHomeData(),
);

export const getBiographyContent = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchBiographyContent(),
);

export const getNewsItems = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchNewsItems(),
);

export const getPressItems = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchPressItems(),
);

export const getArchiveItems = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchArchiveItems(),
);

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () =>
  (await server()).fetchBlogPosts(),
);

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .validator((data) => slugSchema.parse(data))
  .handler(async ({ data }) => (await server()).fetchBlogPostBySlug(data.slug));

export const getInterviewsByCategory = createServerFn({ method: "GET" })
  .validator((data) => categorySchema.parse(data))
  .handler(async ({ data }) => (await server()).fetchInterviewsByCategory(data.category));
