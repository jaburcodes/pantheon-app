// @flow

import React, { Component } from 'react';
import { createRefetchContainer, graphql } from 'react-relay';
import idx from 'idx';
import { createQueryRenderer } from '../../relay/RelayUtils';
import { withContext } from '../../Context';
import type { ContextType } from '../../Context';

import { StatusBar, FlatList, PermissionsAndroid } from 'react-native';
import styled from 'styled-components/native';
import { withNavigation } from 'react-navigation';

import LoggedHeader from '../../components/LoggedHeader';
import ActionButton from '../../components/ActionButton';
import EventListItem from '../Event/EventListItem';
import EmptyView from '../../components/EmptyView';
import { ROUTENAMES } from '../../navigation/RouteNames';
import DistanceModal from './DistanceModal';

const TOTAL_REFETCH_ITEMS = 10;
var timeOutRef;
const Wrapper = styled.View`
  flex: 1;
  background-color: white
`;

type Props = {
  navigation: Object,
  relay: Object,
  context: ContextType,
};

type State = {
  search: string,
  IsSearchVisible: boolean,
  coordinates: Array<number>,
  distance: number,
  isDistanceModalVisible: boolean,
  isRefreshing: boolean,
  isFetchingEnd: boolean,
  hasPosition: boolean
};

@withContext
@withNavigation
class EventsScreen extends Component<Props, State> {
  state = {
    search: '',
    IsSearchVisible: false,
    coordinates: [0, 0],
    distance: 80,
    isDistanceModalVisible: false,
    isRefreshing: false,
    isFetchingEnd: false,
    hasPosition: false
  };

  changeSearchText = (search: string): void => {
    return this.refetch({ search })
  };

  setVisible = () => {
    const { IsSearchVisible, search } = this.state;
    this.setState({
      IsSearchVisible: !IsSearchVisible,
      search: IsSearchVisible ? search : '',
    });
    if (IsSearchVisible) {
      this.refetch({search: ''});
    }
  };

  async componentDidMount() {
    const { context, relay } = this.props;
    console.log('didMount');
    const granted = await PermissionsAndroid.check( PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION );
    console.log('granted', granted);
      navigator.geolocation.getCurrentPosition(
      ({coords}) => {
        console.log('coords', coords);
        const coordinates = [coords.longitude, coords.latitude];
        this.setState({coordinates});

        relay.refetch({coordinates, distance: 80, first: 10});
      },
      error => console.log('error', error),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 20000 },
    );
    
  }

  changeDistance(distance) {
    this.refetch({ distance });
    return this.setState({ isDistanceModalVisible: false });
  }

  onRefresh = () => {
    this.refetch();
  };

  refetch = newRefetchVariable => {
    const { isRefreshing, search, distance, coordinates } = this.state;
    this.setState({ isRefreshing: true });
    newRefetchVariable && this.setState(newRefetchVariable);

    if (isRefreshing) return;
    const refetchVariables = fragmentVariables => ({
      ...fragmentVariables,
      search,
      distance,
      coordinates,
      ...newRefetchVariable,
    });

    console.log('newRefetchVariable', newRefetchVariable);
    this.props.relay.refetch(
      refetchVariables,
      null,
      () =>
        this.setState({
          isRefreshing: false,
          isFetchingEnd: false,
          hasPosition: true,
        }),
      {
        force: true,
      },
    );
    
  };

  onEndReached = () => {
    const { isFetchingEnd } = this.state;

    if (isFetchingEnd) return;

    const { events } = this.props.query;

    if (!events.pageInfo.hasNextPage) return;

    this.setState({
      isFetchingEnd: true,
    });

    const { endCursor } = events.pageInfo;

    const total = events.edges.length + TOTAL_REFETCH_ITEMS;
    const refetchVariables = fragmentVariables => ({
      ...fragmentVariables,
      first: TOTAL_REFETCH_ITEMS,
      cursor: endCursor,
    });
    const renderVariables = {
      first: total,
    };

    this.props.relay.refetch(
      refetchVariables,
      renderVariables,
      () => {
        this.setState({
          isRefreshing: false,
          isFetchingEnd: false,
        });
      },
      {
        force: false,
      },
    );
  };

  renderItem = ({ item }) => {
    const { navigation } = this.props;
    const { isEventAttended, publicList, location, isOwner, title, date, id } = item.node;

    const splittedAddress = location.street.split('-');

    // EventCard  EventListItem
    return (
      <EventListItem
        isEventAttended={isEventAttended}
        userId={id}
        atendees={publicList}
        isOwner={isOwner}
        title={title}
        address={splittedAddress[0]}
        date={date}
        showEventDetails={() =>
          navigation.navigate(ROUTENAMES.EVENT_DETAILS, {
            id,
          })}
      />
    );
  };

  render() {
    const { query } = this.props;
    const {
      search,
      IsSearchVisible,
      distance,
      isDistanceModalVisible,
      isRefreshing,
      hasPosition,
      coordinates
    } = this.state;

    return (
      <Wrapper>
        <StatusBar barStyle="light-content" />
        <LoggedHeader
          title="Events"
          searchValue={search}
          IsSearchVisible={IsSearchVisible}
          showSearch={this.setVisible}
          onChangeSearch={search => this.changeSearchText(search)}
          openDistanceModal={() => this.setState({ isDistanceModalVisible: true })}
          distance={distance}
        />
        <FlatList
          data={coordinates.latitude !== 0 ? idx(query, _ => _.events.edges) : []}
          keyExtractor={item => item.node.id}
          renderItem={this.renderItem}
          onRefresh={this.onRefresh}
          refreshing={isRefreshing}
          onEndReached={this.onEndReached}
          ListEmptyComponent={<EmptyView text="Você não possui eventos próximos" />}
        />
        <ActionButton onPress={() => this.props.navigation.navigate(ROUTENAMES.EVENT_DETAILS)} />
        <DistanceModal
          isVisible={isDistanceModalVisible}
          distance={distance}
          changeDistance={distance => this.changeDistance(distance)}
          closeDistanceModal={() => this.setState({ isDistanceModalVisible: false })}
        />
      </Wrapper>
    );
  }
}

const EventsScreenRefetchContainer = createRefetchContainer(
  EventsScreen,
  {
    query: graphql`
      fragment EventsScreen_query on Query @argumentDefinitions(
          search: { type: String }
          coordinates: { type: "[Float]" }
          distance: { type: Int }
          first: { type: Int, defaultValue: 10 }
          cursor: { type: String }
        ) {
        events(
          first: $first,
          after: $cursor
          search: $search,
          coordinates: $coordinates,
          distance: $distance
        ) @connection(key: "EventsScreen_events", filters: []) {
          edges {
            node {
              id
              isOwner
              schedule {
                title
                talker
                time
              }
              isEventAttended
              title
              date
              location {
                street
              }
              publicList {
                name
                id
              }
            }
          }
        }
      }
    `,
  },
  graphql`
    query EventsScreenRefetchQuery(
      $first: Int
      $cursor: String
      $search: String
      $coordinates: [Float]
      $distance: Int
      ) {
      ...EventsScreen_query
      @arguments(
        first: $first,
        cursor: $cursor,
        search: $search,
        coordinates: $coordinates,
        distance: $distance
      )
    }
  `,
);

export default createQueryRenderer(EventsScreenRefetchContainer, EventsScreen, {
  query: graphql`
    query EventsScreenQuery {
      ...EventsScreen_query
    }
  `,
  variables: {
    first: 10,
  }
});
