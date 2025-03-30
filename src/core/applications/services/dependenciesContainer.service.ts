import { SContainer } from "opticore-inject-dependency";
import { dependenciesProvider } from "../../providers/dependencies.provider";
import { getEnvironnementValue } from "opticore-env-access";
import { envPath } from "opticore-webapp";

export const dependenciesContainerService: () => SContainer = (): SContainer => {
    return new SContainer(dependenciesProvider, getEnvironnementValue(envPath).defaultLocal);
}