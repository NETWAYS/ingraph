<?php
/*
 * Copyright (C) 2013 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

interface inGraph_Backend
{
    /**
     * Fetch hosts
     *
     * Usage:
     * <code>
     * // Fetch all hosts
     * $hosts = $backend->fetchHosts('%');
     * $hosts = $backend->fetchHosts('*');
     *
     * // Fetch all hosts prefixed with 'node'
     * $hosts = $backend->fetchHosts('node*');
     * </code>
     *
     * @param   string      $hostPattern
     * @param   int|null    $limit          Constrain the number of rows returned
     * @param   int         $offset         Offset of the first row to return
     *
     * @return  array
     */
    public function fetchHosts($pattern, $limit = null, $offset = 0);

    /**
     * Fetch services
     *
     * @param   string      $hostPattern
     * @param   string      $servicePattern
     * @param   int|null    $limit          Constrain the number of rows returned
     * @param   int         $offset         Offset of the first row to return
     *
     * @return  array
     */
    public function fetchServices($hostPattern, $servicePattern, $limit = null, $offset = 0);

    /**
     * Fetch plots
     *
     * @param   string      $hostPattern
     * @param   string      $servicePattern
     * @param   string      $parentServicePattern
     * @param   string      $plotPattern
     * @param   int|null    $limit                  Constrain the number of rows returned
     * @param   int         $offset                 Offset of the first row to return
     *
     * @return  array
     */
    public function fetchPlots(
        $hostPattern, $servicePattern, $parentServicePattern, $plotPattern, $limit = null, $offset = 0
    );

    /**
     * Fetch values
     *
     * @param   array       $query
     * @param   int|null    $start  Start timestamp of the first value to return
     * @param   int|null    $end    End timestamp of the last value to return
     *
     * @return  array
     */
    public function fetchValues($query, $start = null, $end = null);

    /**
     * Create comment
     *
     * @param   string      $host
     * @param   string|null $parentService
     * @param   string      $service
     * @param   int         $timestamp
     * @param   string      $author
     * @param   string      $comment
     *
     * @return  int
     */
    public function createComment($host, $service, $time, $author, $comment);

    /**
     * Update comment
     *
     * @param   string      $host
     * @param   string|null $parentService
     * @param   string      $service
     * @param   int         $timestamp
     * @param   string      $author
     * @param   string      $comment
     *
     * @return  int
     */
    public function updateComment($id, $host, $service, $time, $author, $text);

    /**
     * Delete comment
     *
     * @param int $id
     */
    public function deleteComment($id);

    /**
     * Get the name of the backend
     *
     * @return string
     */
    public function getName();
}
