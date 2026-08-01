import { createServerFn } from "@tanstack/react-start";
import { categorySchema, slugSchema } from "./public-content.schemas";

export const getHomeData = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchHomeData(),
);

export const getBiographyContent = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchBiographyContent(),
);

export const getNewsItems = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchNewsItems(),
);

export const getPressItems = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchPressItems(),
);

export const getArchiveItems = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchArchiveItems(),
);

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./public-content.server")).fetchBlogPosts(),
);

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .validator((data) => slugSchema.parse(data))
  .handler(async ({ data }) =>
    (await import("./public-content.server")).fetchBlogPostBySlug(data.slug),
  );

export const getInterviewsByCategory = createServerFn({ method: "GET" })
  .validator((data) => categorySchema.parse(data))
  .handler(async ({ data }) =>
    (await import("./public-content.server")).fetchInterviewsByCategory(data.category),
  );
