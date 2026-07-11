-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'TV_SERIES', 'MINI_SERIES', 'ANIME', 'DOCUMENTARY', 'SHORT_FILM');

-- CreateEnum
CREATE TYPE "InteractionAction" AS ENUM ('WATCHED', 'NOT_INTERESTED', 'SAVED');

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "type" "TitleType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "releaseYear" INTEGER,
    "runtimeMinutes" INTEGER,
    "overview" TEXT,
    "posterPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleGenre" (
    "titleId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "TitleGenre_pkey" PRIMARY KEY ("titleId","genreId")
);

-- CreateTable
CREATE TABLE "TitleMood" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "moodTag" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "TitleMood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "TitleLanguage" (
    "titleId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "dubAvailable" BOOLEAN NOT NULL DEFAULT false,
    "subAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TitleLanguage_pkey" PRIMARY KEY ("titleId","languageCode")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,
    "popularity" DOUBLE PRECISION,
    "criticScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationScore" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "computedScore" DOUBLE PRECISION NOT NULL,
    "componentsJson" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchProvider" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "WatchProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTitle" (
    "collectionId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,

    CONSTRAINT "CollectionTitle_pkey" PRIMARY KEY ("collectionId","titleId")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "titleId" TEXT NOT NULL,
    "action" "InteractionAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "titlesUpserted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Title_tmdbId_key" ON "Title"("tmdbId");

-- CreateIndex
CREATE INDEX "Title_type_releaseYear_idx" ON "Title"("type", "releaseYear");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "TitleMood_moodTag_idx" ON "TitleMood"("moodTag");

-- CreateIndex
CREATE INDEX "Rating_titleId_idx" ON "Rating"("titleId");

-- CreateIndex
CREATE INDEX "RecommendationScore_region_computedScore_idx" ON "RecommendationScore"("region", "computedScore");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationScore_titleId_region_key" ON "RecommendationScore"("titleId", "region");

-- CreateIndex
CREATE INDEX "WatchProvider_titleId_region_idx" ON "WatchProvider"("titleId", "region");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "UserInteraction_sessionId_idx" ON "UserInteraction"("sessionId");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_idx" ON "UserInteraction"("userId");

-- AddForeignKey
ALTER TABLE "TitleGenre" ADD CONSTRAINT "TitleGenre_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleGenre" ADD CONSTRAINT "TitleGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleMood" ADD CONSTRAINT "TitleMood_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleLanguage" ADD CONSTRAINT "TitleLanguage_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleLanguage" ADD CONSTRAINT "TitleLanguage_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationScore" ADD CONSTRAINT "RecommendationScore_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchProvider" ADD CONSTRAINT "WatchProvider_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTitle" ADD CONSTRAINT "CollectionTitle_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTitle" ADD CONSTRAINT "CollectionTitle_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
