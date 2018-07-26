import * as React from 'react';
import { SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Dimensions, View } from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-modal-datetime-picker';
import Timeline from 'react-native-timeline-listview';
import type { NavigationScreenProps } from 'react-navigation';

import styled from 'styled-components/native';
import moment from 'moment';

import { IMAGES } from '../../utils/design/images';
import LocationPicker from '../../components/LocationPicker';
import ScheduleAddModal from '../../components/ScheduleAddModal';
import EventAddMutation from './EventAddMutation';
import EventEditMutation from './EventEditMutation';
import { withContext } from '../../Context';
import { createFragmentContainer, graphql } from 'react-relay';
import { createQueryRenderer } from '../../relay/RelayUtils';
import idx from 'idx';
import { ROUTENAMES } from '../../navigation/RouteNames';

const { width } = Dimensions.get('window');

const Wrapper = styled(LinearGradient).attrs({
  colors: ['rgb(41, 123, 247)', '#651FFF'],
  start: { x: 0.0, y: 0.25 },
  end: { x: 0.5, y: 1.0 },
})`
  flex: 1;
`;

const HeaderContainer = styled.View`
  padding: 10px 20px;
  padding-bottom: 20;
  z-index: 1000
`;

const Header = styled.View`
  margin-top: 10;
  flex-direction: row;
  align-items: center;
  justify-content: space-between; 
  z-index: 1000;
`;

const HeaderButton = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  z-index: 1000;
  margin-top: 10;
`;

const CloseIcon = styled.Image.attrs({
  source: IMAGES.CLOSE,
})`
  width: 26;
  height: 26;
  tint-color: white;
`;

const CreateButton = styled.TouchableOpacity`
  padding: 8px 20px;
  z-index: 1000;
  border-radius: 20;
  align-items: center;
  justify-content: center;
  background-color: white;
  margin-right: -10;
`;

const SmallText = styled.Text`
  color: ${props => props.theme.colors.primaryColor};
  font-size: 16;
  font-weight: 800; 
`;

const EventName = styled.TextInput.attrs({
  autoFocus: true,
  placeholderTextColor: 'rgba(255,255,255,0.43)',
  placeholder: 'Event Title ...',
  underlineColorAndroid: 'transparent',
  selectionColor: 'white',
})`
  font-size: 24px;
  color: white;
  font-weight: 800;
  width: 88%;
  margin: 20px 25px;
  margin-top: 40;
`;

const EventDescription = styled.TextInput.attrs({
  blurOnSubmit: true,
  multiline: true,
  placeholderTextColor: 'rgba(255,255,255,0.43)',
  placeholder: 'What’s the plan for the event?',
  underlineColorAndroid: 'transparent',
  selectionColor: 'white',
})`
  font-size: 26px;
  color: white;
  font-weight: 800;
  width: 88%;
  height: 150px;
  margin: 10px 25px;
`;

const DateAndLocationRow = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin: 10px 30px;
`;

const ValuesContainer = styled.View`
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  margin-horizontal: 10;
`;

const Value = styled.Text`
  font-size: 20px;
  color: ${props => (props.active ? 'white' : 'rgba(255,255,255,0.43)')};
  margin: 5px 0px;
  font-weight: 800;
`;

const BiggerText = styled(Value)`
  font-size: 27px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-left: 10;
`;

const IncreaseButtons = styled.TouchableOpacity`
  width: 36;
  height: 36;
  background-color: white;
  border-radius: ${36 / 2};
  align-items: center;
  justify-content: center;
  margin: 0px 20px;
`;

const PlusIcon = styled.Image.attrs({
  source: IMAGES.ADD,
})`
  width: 20;
  height: 20;
  tint-color: ${props => props.theme.colors.primaryColor};
`;

const AddIcon = styled.Image.attrs({
  source: IMAGES.ADD,
})`
  width: 35;
  height: 35;
  tint-color: ${props => props.theme.colors.primaryColor};
`;

const MinusIcon = styled.Image.attrs({
  source: IMAGES.MINUS,
})`
  width: 20;
  height: 20;
  tint-color: ${props => props.theme.colors.primaryColor};
`;

const ScheduleList = styled(Timeline).attrs({
  circleSize: 15,
  lineColor: 'white',
  lineWidth: 4,
  circleColor: 'rgb(0, 188, 255)',
  showTime: false,
})`
  padding: 10px 20px;
  flex: 1; 
`;

const ScheduleBaloon = styled.View`
  background-color: white;
  flex-direction: row;
  align-items: center;
  padding-horizontal: 20;
  padding-vertical: 15;
  border-radius: 30;
  border-top-left-radius: 0;
  margin: 10px 0px;
`;

const CommentText = styled.Text`
  font-size: 16;
  font-weight: bold;
  color: rgb(51, 108, 248); 
  width: ${width - 160};
`;

const ProfileInitials = styled.View`
  width: 40;
  height: 40;
  border-radius: 20;
  align-items: center;
  justify-content: center;
  background-color: #651FFF
`;

const InitialsText = styled.Text`
  color: white;
  font-size: 24;
  font-weight: bold
`;

const AddButton = styled.TouchableOpacity`
  width: 62;
  height: 62;
  border-radius: ${62 / 2};
  background-color: white;
  align-items: center;
  justify-content: center;
  margin: 40px 0px;
`;

const Container = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

type Schedules = { title: string, talker: string, time: string };

type State = {
  title: string,
  description: string,
  date: string,
  cep: string,
  coordinates: Array<number>,
  address: string,
  schedules: Array<Schedules>,
  errorText: string,
  eventLimit: number,
  isDatePickerVisible: boolean,
  isLocationPickerVisible: boolean,
  isLoading: boolean,
  isScheduleModalVisible: boolean,
};

type NavigationState = {
  params: {},
};

type Props = {
  navigation: NavigationScreenProps<NavigationState>,
};

@withContext class EventAdd extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      description: '',
      date: '',
      cep: '',
      coordinates: [0, 0],
      address: '',
      number: '',
      eventLimit: 10,
      schedules: [],
      errorText: '',
      isDatePickerVisible: false,
      isLocationPickerVisible: false,
      isLoading: false,
      isScheduleModalVisible: false,
      ...this.props.query.event,
    };
    this.timer = null;
  }

  addOne = () => {
    this.setState({ eventLimit: this.state.eventLimit + 1 });
    this.timer = setTimeout(this.addOne, 80);
  };

  stopTimer = () => {
    clearTimeout(this.timer);
  };

  handleDatePicked = (date: string) => {
    this.setState({
      date,
      isDatePickerVisible: false,
    });
  };

  getInitials = name => {
    return name ? name.split(' ').slice(0, 2).map(namePart => namePart.charAt(0).toUpperCase()).join('') : '';
  };

  setDatePicker = () => this.setState({ isDatePickerVisible: !this.isDatePickerVisible });

  renderItem = (schedule: Schedules) => {
    const { title, talker, time } = schedule;

    if (!talker) {
      return (
        <ScheduleBaloon>
          <View>
            <CommentText>{title}</CommentText>
            <CommentText>{time}</CommentText>
          </View>
        </ScheduleBaloon>
      );
    }

    return (
      <ScheduleBaloon>
        <View>
          <CommentText>{title}</CommentText>
          <CommentText>{time}</CommentText>
        </View>
        <ProfileInitials>
          <InitialsText>{this.getInitials(talker)}</InitialsText>
        </ProfileInitials>
      </ScheduleBaloon>
    );
  };

  setScheduleModal = () => this.setState({ isScheduleModalVisible: !this.state.isScheduleModalVisible });

  onCloseScheduleModal = () => this.setState({ isScheduleModalVisible: false });

  onConfirmSchedule = newSchedule => {
    this.setState({
      schedules: [...this.state.schedules, newSchedule],
      isScheduleModalVisible: false,
    });
  };

  save = () => {
    const { title, description, coordinates, address, date, number, cep, schedules, eventLimit } = this.state;
    const isEdit = this.props.query.event;

    let input = {
      title,
      description,
      date,
      schedule: schedules,
      publicLimit: eventLimit,
      location: {
        coordinates,
        cep,
        street: address,
        number,
      },
      id: idx(this, _ => _.props.navigation.state.params.id) || undefined,
    };

    const onError = () => {
      this.props.context.openModal('An Unexpected Error Ocurred');
    };

    const onCompleted = (response: Object) => {
      if (response.error) {
        return this.props.context.openModal(response.error);
      }
      this.props.navigation.navigate(ROUTENAMES.EVENTS);
    };

    isEdit
      ? EventEditMutation.commit(input, onCompleted, onError)
      : EventAddMutation.commit(input, onCompleted, onError);
  };

  onFindLocation = location => {
    const { zipCode, address, lat, lng, number } = location;

    this.setState({
      isLocationPickerVisible: false,
      coordinates: [lat, lng],
      address,
      cep: zipCode,
      number,
    });
  };

  render() {
    const {
      title,
      description,
      address,
      date,
      eventLimit,
      isDatePickerVisible,
      schedules,
      isScheduleModalVisible,
    } = this.state;
    const formatted = address.split('-');

    const isEdit = this.props.query.event;
    return (
      <Wrapper>
        <StatusBar barStyle="light-content" />
        <HeaderContainer>
          <SafeAreaView />
          <Header>
            <HeaderButton onPress={() => this.props.navigation.goBack()}>
              <CloseIcon />
            </HeaderButton>
            <CreateButton onPress={this.save}>
              <SmallText>{isEdit ? 'EDIT' : 'CREATE'}</SmallText>
            </CreateButton>
          </Header>
        </HeaderContainer>
        <ScrollView>
          <EventName value={title} maxLength={50} onChangeText={(title: string) => this.setState({ title })} />
          <EventDescription
            value={description}
            maxLength={100}
            onChangeText={(description: string) => this.setState({ description })}
          />
          <DateAndLocationRow>
            <ValuesContainer>
              <Value active>WHEN</Value>
              <TouchableOpacity onPress={this.setDatePicker}>
                <Value>{date ? moment(date).format('MMM Do YYYY') : 'Pick a date'}</Value>
              </TouchableOpacity>
            </ValuesContainer>

            <ValuesContainer>
              <Value active>WHERE</Value>
              <TouchableOpacity
                onPress={() => this.setState({ isLocationPickerVisible: !this.state.isLocationPickerVisible })}
              >
                <Value>{address ? formatted[0] : 'Set a location'}</Value>
              </TouchableOpacity>
            </ValuesContainer>

          </DateAndLocationRow>
          <DateAndLocationRow>
            <BiggerText active>Event Limit: </BiggerText>
            <Row>
              <IncreaseButtons onPressIn={this.addOne} onPressOut={this.stopTimer}>
                <PlusIcon />
              </IncreaseButtons>
              <Value active>{eventLimit}</Value>
              <IncreaseButtons
                onPress={() => this.setState({ eventLimit: eventLimit === 0 ? eventLimit : eventLimit - 1 })}
              >
                <MinusIcon />
              </IncreaseButtons>
            </Row>
          </DateAndLocationRow>
          <ScheduleList data={schedules} renderDetail={this.renderItem} />
          <Container>
            <AddButton onPress={this.setScheduleModal}>
              <AddIcon />
            </AddButton>
          </Container>
        </ScrollView>

        <LocationPicker
          isVisible={this.state.isLocationPickerVisible}
          onFindLocation={this.onFindLocation}
          onClosePicker={() => this.setState({ isLocationPickerVisible: !this.state.isLocationPickerVisible })}
        />

        <ScheduleAddModal
          isVisible={isScheduleModalVisible}
          modalText="Add a new item to schedule"
          isLoading={false}
          onClose={this.onCloseScheduleModal}
          onConfirm={this.onConfirmSchedule}
        />

        <DatePicker
          onCancel={() => this.setState({ isDatePickerVisible: false })}
          onConfirm={this.handleDatePicked}
          isVisible={isDatePickerVisible}
        />
      </Wrapper>
    );
  }
}

const EventAddFragmentCotnainer = createFragmentContainer(EventAdd, {
  query: graphql`
    fragment EventAdd_query on Query @argumentDefinitions(id: { type: "ID" }) {
      me {
        email
      }
      event(id: $id) {
        title
        location {
          street
        }
        description
        date
        isOwner
        schedule {
          time
          title
          talker
        }
        publicList {
          name
        }
        isEventAttended
      }
    }
  `,
});

export default createQueryRenderer(EventAddFragmentCotnainer, EventAdd, {
  query: graphql`
    query EventAddQuery($id: ID) {
      ...EventAdd_query @arguments(id: $id)
    }
  `,
  queriesParams: props => {
    return {
      id: idx(props, _ => _.navigation.state.params.id),
    };
  },
});
