import { config } from "@anandchowdhary/cosmic";
import { couponCodesUpdateInput } from "@prisma/client";
import {
  cleanElasticSearchQueryResponse,
  elasticSearch,
} from "@staart/elasticsearch";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { getEvents } from "@staart/payments";
import { ms, randomString } from "@staart/text";
import { ScopesAdmin } from "../config";
import { Acts, can } from "../helpers/authorization";
import { couponCodeJwt } from "../helpers/jwt";
import {
  paginatedResult,
  prisma,
  queryParamsToSelect,
} from "../helpers/prisma";

const ELASTIC_LOGS_INDEX = config("elasticLogsIndex");

export const getAllGroupForUser = async (
  tokenUserId: number,
  queryParams: any
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.GROUPS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.groups.findMany(queryParamsToSelect(queryParams)),
    { take: queryParams.take }
  );
};

export const getAllUsersForUser = async (
  tokenUserId: number,
  queryParams: any
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.USERS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.users.findMany(queryParamsToSelect(queryParams)),
    { take: queryParams.take }
  );
};

export const getAllCouponsForUser = async (
  tokenUserId: number,
  queryParams: any
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.COUPONS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.couponCodes.findMany(queryParamsToSelect(queryParams)),
    { take: queryParams.take }
  );
};

export const getCouponForUser = async (
  tokenUserId: number,
  couponId: string
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.COUPONS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.couponCodes.findOne({ where: { id: parseInt(couponId) } });
};

export const updateCouponForUser = async (
  tokenUserId: number,
  couponId: string,
  data: couponCodesUpdateInput
) => {
  if (!(await can(tokenUserId, Acts.WRITE, ScopesAdmin.COUPONS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.couponCodes.update({
    data,
    where: { id: parseInt(couponId) },
  });
};

export const deleteCouponForUser = async (
  tokenUserId: number,
  couponId: string
) => {
  if (!(await can(tokenUserId, Acts.WRITE, ScopesAdmin.COUPONS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.couponCodes.delete({ where: { id: parseInt(couponId) } });
};

export const generateCouponForUser = async (tokenUserId: number, body: any) => {
  if (!(await can(tokenUserId, Acts.WRITE, ScopesAdmin.COUPONS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  if (body.jwt)
    return couponCodeJwt(body.amount, body.currency, body.description);
  delete body.jwt;
  body.code =
    body.code || randomString({ length: 10, type: "distinguishable" });
  return prisma.couponCodes.create({
    data: body,
  });
};

export const getPaymentEventsForUser = async (
  tokenUserId: number,
  body: any
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.PAYMENT_EVENTS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  return getEvents(body);
};

/**
 * Get an API key
 */
export const getServerLogsForUser = async (
  tokenUserId: number,
  query: {
    range?: string;
    from?: string;
  }
) => {
  if (!(await can(tokenUserId, Acts.READ, ScopesAdmin.SERVER_LOGS)))
    throw new Error(INSUFFICIENT_PERMISSION);

  const range: string = query.range || "7d";
  const from = query.from ? parseInt(query.from) : 0;
  const result = await elasticSearch.search({
    index: ELASTIC_LOGS_INDEX,
    from,
    body: {
      query: {
        bool: {
          must: [
            {
              range: {
                date: {
                  gte: new Date(new Date().getTime() - ms(range)),
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          date: { order: "desc" },
        },
      ],
      size: 10,
    },
  });
  return cleanElasticSearchQueryResponse(result.body, 10);
};
