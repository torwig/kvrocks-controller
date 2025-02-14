/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

"use client";

import { Container, Typography } from "@mui/material";
import { NamespaceSidebar } from "../../ui/sidebar";
import { AddClusterCard, CreateCard } from "../../ui/createCard";
import { fetchCluster, fetchClusters, fetchNamespaces } from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/app/ui/loadingSpinner";

export default function Namespace({
    params,
}: {
  params: { namespace: string };
}) {
    const [clusterData, setClusterData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedNamespaces = await fetchNamespaces();

                if (!fetchedNamespaces.includes(params.namespace)) {
                    console.error(`Namespace ${params.namespace} not found`);
                    router.push("/404");
                    return;
                }

                const clusters = await fetchClusters(params.namespace);
                const data = await Promise.all(
                    clusters.map((cluster) =>
                        fetchCluster(params.namespace, cluster).catch((error) => {
                            console.error(
                                `Failed to fetch data for cluster ${cluster}:`,
                                error
                            );
                            return null;
                        })
                    )
                );
                setClusterData(data.filter(Boolean));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.namespace, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex h-full">
            <NamespaceSidebar />
            <Container
                maxWidth={false}
                disableGutters
                sx={{ height: "100%", overflowY: "auto", marginLeft: "16px" }}
            >
                <div className="flex flex-row flex-wrap">
                    <AddClusterCard namespace={params.namespace} />
                    {clusterData.map(
                        (data, index) =>
                            data && (
                                <Link
                                    href={`/namespaces/${params.namespace}/clusters/${data.name}`}
                                    key={index}
                                >
                                    <CreateCard>
                                        <Typography variant="h6" gutterBottom>
                                            {data.name}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                      Version: {data.version}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                      Shards: {data.shards.length}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                      Slots: {data.shards[0].slot_ranges.join(", ")}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                      Target Shard Index: {data.shards[0].target_shard_index}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                      Migrating Slot: {data.shards[0].migrating_slot}
                                        </Typography>
                                    </CreateCard>
                                </Link>
                            )
                    )}
                </div>
            </Container>
        </div>
    );
}
